package org.poweruptime.backend.features.monitor

import org.poweruptime.backend.amqp.RabbitMQ.MONITOR_QUEUE
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.abbreviate
import org.poweruptime.backend.features.monitor.core.MonitorCheckerFactory
import org.poweruptime.backend.features.monitor.dto.CheckResultResponse
import org.poweruptime.backend.features.monitor.dto.MonitorFullResponse
import org.poweruptime.backend.features.monitor.dto.PushCheckResultDto
import org.poweruptime.backend.features.monitor.dto.PushMonitorDto
import org.poweruptime.backend.features.monitor.model.CheckResult
import org.poweruptime.backend.features.monitor.model.CheckResultLogStage
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.TimeOption
import org.poweruptime.backend.features.monitor.service.CheckResultLogEntryService
import org.poweruptime.backend.features.monitor.service.CheckResultService
import org.poweruptime.backend.features.monitor.service.MonitorService
import org.poweruptime.backend.features.monitor.service.myFormat
import org.poweruptime.backend.features.notification.model.Notification
import org.poweruptime.backend.features.notification.service.NotificationService
import org.poweruptime.backend.features.push.PushService
import org.slf4j.LoggerFactory
import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.stereotype.Component
import java.time.Duration
import java.time.Instant

private const val QUEUE_MONITOR_TIMEOUT_SECONDS = 10L
private const val MONITOR_DEFAULT_RETRY = 0L

/**
 * Extension function to flip [Boolean] if [upsideDown] is true.
 */
private fun Boolean.adjustForUpsideDown(upsideDown: Boolean) = if (upsideDown) !this else this

@Component
class MonitorListener(
    private val checkResultService: CheckResultService,
    private val checkResultLogEntryService: CheckResultLogEntryService,
    private val monitorService: MonitorService,
    private val monitorCheckerFactory: MonitorCheckerFactory,
    private val notificationService: NotificationService,
    private val pushService: PushService,
) {
    private val logger = LoggerFactory.getLogger(MonitorListener::class.java)

    /**
     * Receives messages from "monitor-queue" and processes [CheckResult] by ID.
     */
    @RabbitListener(queues = [MONITOR_QUEUE])
    fun monitorQueueConsumer(monitorCheckId: String) {
        val checkResult = checkResultService.getByIdOrThrow(monitorCheckId)
        val monitor = checkResult.monitor

        logger.debug(
            """Received monitor check "{}" of monitor "{}".""",
            checkResult.id,
            monitor.name,
        )

        // Perform the actual check and persist the updated CheckResult
        val updatedCheck = processCheckResult(checkResult)

        // Notify subscribed clients about the new check result
        sendNewCheckResultPush(monitor, updatedCheck)

        // Attempt to update the monitor’s status if needed
        val oldStatus = monitor.status
        val updatedMonitor = updateMonitorStatusIfRequired(monitor, updatedCheck)

        // If the monitor status changed, send a monitor status change push
        sendStatusChangePushIfNeeded(oldStatus, updatedMonitor)

        // Send notifications (UP / DOWN) if required
        sendUpOrDownNotifications(oldStatus, updatedMonitor, updatedCheck)
    }

    /**
     * Orchestrates the check flow (picked up time, maintenance/paused checks, main check).
     */
    private fun processCheckResult(checkResult: CheckResult): CheckResult {
        val updatedCheck = checkResultService.save(
            performCheck(checkResult).apply {
                require(status != MonitorStatus.PENDING) { "Check result must not remain PENDING." }
                requireNotNull(pickedUpAt) { "Check result pickedUpAt must not be null." }
                requireNotNull(previousStatus) { "Check result previousStatus must not be null." }
            },
        )

        checkResultLogEntryService.info(
            stage = CheckResultLogStage.CHECK,
            checkResult = updatedCheck,
            message = "Sent result to subscribed clients",
        )

        return updatedCheck
    }

    /**
     * Performs the actual check, including handling late pickup, paused/maintenance, and running the checker.
     */
    private fun performCheck(checkResult: CheckResult): CheckResult = checkResult.apply {
        pickedUpAt = Instant.now()

        val previousCheck = getPrevious()
        previousStatus = previousCheck?.status ?: monitor.status

        // 1) Handle late pickup
        val isPickedUpTooLate = isPickedUpTooLate()
        checkResultLogEntryService.action(
            stage = CheckResultLogStage.SETUP,
            checkResult = checkResult,
            message = "Job picked up in time",
            properties = mapOf(
                "result" to (!isPickedUpTooLate).toString(),
                "time" to Duration.between(checkResult.createdAt, checkResult.pickedUpAt!!).toMillis().toString(),
            ),
        )
        if (isPickedUpTooLate) {
            handleLatePickup()

            logger.error("""Monitor check "{}" was picked up too late.""", id)

            return@apply
        }

        // 2) Check if monitor is paused or in maintenance
        val isPausedOrInMaintenance = monitor.status in listOf(MonitorStatus.PAUSED, MonitorStatus.MAINTENANCE)

        checkResultLogEntryService.action(
            stage = CheckResultLogStage.CHECK,
            checkResult = this,
            message = "Monitor not paused or in maintenance",
            properties = mapOf("result" to (!isPausedOrInMaintenance).toString()),
        )
        if (isPausedOrInMaintenance) {
            handlePausedOrMaintenance()
            return@apply
        }

        // 3) Execute the actual check logic
        val (pingMsValue, isUp, titleStr, messageStr) = monitorCheckerFactory.execute(monitor)

        status = if (isUp.adjustForUpsideDown(monitor.upsideDown)) MonitorStatus.UP else MonitorStatus.DOWN
        checkedAt = Instant.now()
        pingMs = pingMsValue
        title = titleStr.abbreviate(Database.MAX_TITLE_LENGTH)
        message = messageStr?.abbreviate(Database.MAX_MESSAGE_LENGTH)

        // If DOWN, increment retry count
        if (status == MonitorStatus.DOWN) {
            timesRetried = (previousCheck?.timesRetried ?: 0) + 1
        }

        checkResultLogEntryService.action(
            stage = CheckResultLogStage.CHECK,
            checkResult = this,
            message = "Performing uptime check",
            properties = mapOf(
                "result" to isUp.adjustForUpsideDown(monitor.upsideDown).toString(),
                "time" to pingMsValue.toString(),
            ),
        )
    }

    /**
     * Send a push notification for the new check result.
     */
    private fun sendNewCheckResultPush(monitor: Monitor, updatedCheck: CheckResult) {
        logger.info(
            """Send push new check result for team "{}"""",
            monitor.team.id,
        )
        pushService.send(
            monitor.team.id,
            PushCheckResultDto(checkResult = CheckResultResponse(updatedCheck)),
        )
    }

    /**
     * Attempts to update the [monitor]'s status if it is UP or DOWN; returns the updated monitor.
     */
    private fun updateMonitorStatusIfRequired(monitor: Monitor, updatedCheck: CheckResult): Monitor {
        return when (updatedCheck.status) {
            MonitorStatus.UP, MonitorStatus.DOWN -> {
                val successfulUpdatedMonitor = monitorService.updateStatus(
                    monitor.id,
                    determineUpdatedMonitorStatus(monitor, updatedCheck),
                ) > 0

                val updatedMonitor = if (successfulUpdatedMonitor) {
                    monitorService.getByIdOrThrow(monitor.id)
                } else {
                    logger.warn(
                        """Monitor "{}", was updated after receiving it for processing.
                          |Could not persist to db. Continuing with not-persisted monitor
                        """.trimMargin(),
                        monitor.name,
                    )
                    monitor
                }

                checkResultLogEntryService.action(
                    stage = CheckResultLogStage.MONITOR_STATUS_UPDATE,
                    checkResult = updatedCheck,
                    message = "Monitor updated to ${updatedMonitor.status.name.uppercase()}",
                    properties = mapOf("result" to successfulUpdatedMonitor.toString()),
                )
                updatedMonitor
            }
            else -> {
                logger.info(
                    """Monitor "{}", new status: "{}", not processing status change.""",
                    monitor.name,
                    updatedCheck.status,
                )

                monitor
            }
        }
    }

    /**
     * Sends a push if the monitor status has changed from [oldStatus] to the new monitor status.
     */
    private fun sendStatusChangePushIfNeeded(oldStatus: MonitorStatus, updatedMonitor: Monitor) {
        if (oldStatus != updatedMonitor.status) {
            logger.debug(
                """Send push status change for team "{}"""",
                updatedMonitor.team.id,
            )

            pushService.send(
                updatedMonitor.team.id,
                PushMonitorDto(monitor = updatedMonitor.toFullResponse()),
            )
        }
    }

    private fun Monitor.toFullResponse() = MonitorFullResponse(
        this,
        uptime = checkResultService.uptimeStatisticsDto(this),
        lastCheckResults = checkResultService.getLastByMonitorId(this.id, 20),
        oneDayUptime = checkResultService.calculateRecentUptimeByMonitorId(this.id, TimeOption.ONE_DAY).myFormat(),
    )

    /**
     * Decides if and sends a UP or DOWN notification. It also checks for resend logic.
     */
    private fun sendUpOrDownNotifications(
        oldStatus: MonitorStatus,
        updatedMonitor: Monitor,
        checkResult: CheckResult
    ) {
        val shouldSendNotification = when {
            updatedMonitor.isFirstUpResultAfterBoot(oldStatus) -> {
                logNoNotificationNeeded(
                    checkResult,
                    reason = "First up result after server start, not queuing notifications",
                )
                false
            }
            // Monitor has resending enabled, the status is the same as before and DOWN
            updatedMonitor.resendAfter != null &&
                oldStatus == updatedMonitor.status &&
                updatedMonitor.status == MonitorStatus.DOWN -> {
                logMonitorHasResendingEnabled(checkResult, updatedMonitor.resendAfter!!)
                val resendNotification = shouldResendNotification(updatedMonitor, checkResult)
                logResendDownNotification(checkResult, resendNotification)
                resendNotification
            }
            oldStatus != updatedMonitor.status -> {
                logSendNormalNotification(checkResult, updatedMonitor, oldStatus)
                true
            }
            else -> {
                // Duplicate status without resending
                require(oldStatus == updatedMonitor.status)
                logNoNotificationNeeded(
                    checkResult,
                    reason = "Duplicate status, not queuing notifications",
                )
                false
            }
        }

        if (shouldSendNotification) {
            sendNotifications(updatedMonitor, checkResult)
        }
    }

    /**
     * Sends notifications for the updated [monitor] and [checkResult].
     */
    private fun sendNotifications(monitor: Monitor, checkResult: CheckResult) {
        // Create and queue notifications for each enabled method
        val notifications = monitor.enabledNotificationMethods.map { method ->
            Notification(
                method = method,
                checkResult = checkResult,
                title = checkResult.title
                    ?: throw IllegalArgumentException("Title cannot be null at this point."),
                message = checkResult.message,
            )
        }

        notificationService.saveAll(notifications).forEach {
            notificationService.queueNotification(it.id)

            checkResultLogEntryService.info(
                stage = CheckResultLogStage.NOTIFICATION,
                checkResult = checkResult,
                message = """Queued "${it.method.name}" notification""",
                properties = mapOf("notificationId" to it.id),
            )
        }
    }

    /**
     * Decides new [Monitor.status] based on the [CheckResult].
     */
    private fun determineUpdatedMonitorStatus(monitor: Monitor, checkResult: CheckResult): MonitorStatus {
        return if (checkResult.status == MonitorStatus.UP) {
            MonitorStatus.UP
        } else {
            setMonitorDownIfRetriesExhausted(monitor, checkResult)
        }
    }

    /**
     * Marks a [Monitor] as DOWN only when retries are exhausted, or immediately if the monitor
     * was PENDING (first check after server start).
     */
    private fun setMonitorDownIfRetriesExhausted(monitor: Monitor, checkResult: CheckResult): MonitorStatus {
        require(checkResult.status == MonitorStatus.DOWN) {
            "This function should only be called if the checkResult is DOWN."
        }

        return when {
            // Immediately mark as DOWN if it was previously PENDING
            monitor.status == MonitorStatus.PENDING -> {
                checkResultLogEntryService.info(
                    stage = CheckResultLogStage.MONITOR_STATUS_UPDATE,
                    checkResult = checkResult,
                    message = "Previous monitor status is pending",
                )
                MonitorStatus.DOWN
            }
            checkResult.timesRetried != null -> {
                val timesRetried = checkResult.timesRetried!!

                // Mark as DOWN if the down-check count (including this one) >= retries
                // Otherwise, remain UP until all retries are used
                if (timesRetried >= (monitor.retries ?: MONITOR_DEFAULT_RETRY)) {
                    checkResultLogEntryService.info(
                        stage = CheckResultLogStage.MONITOR_STATUS_UPDATE,
                        checkResult = checkResult,
                        message = """Monitor exceeded maximal retries. Currently retried ${timesRetried}x
                                | (max ${monitor.retries ?: 0}x retries)
                        """.trimMargin(),
                    )
                    MonitorStatus.DOWN
                } else {
                    checkResultLogEntryService.info(
                        stage = CheckResultLogStage.MONITOR_STATUS_UPDATE,
                        checkResult = checkResult,
                        message = """Monitor did not exceed maximal retries. Currently retried ${timesRetried}x
                                | (max ${monitor.retries ?: 0}x retries)
                        """.trimMargin(),
                    )
                    MonitorStatus.UP
                }
            }
            else -> MonitorStatus.DOWN
        }
    }

    /**
     * Extension function on [CheckResult] to retrieve the previous result for the same monitor.
     */
    private fun CheckResult.getPrevious(): CheckResult? {
        return checkResultService
            .getLastByMonitorId(monitor.id, 2)
            .firstOrNull { it.id != this.id }
    }

    /**
     * Determines if we need to re-send notifications (only relevant for DOWN status and resendAfter enabled).
     */
    private fun shouldResendNotification(monitor: Monitor, checkResult: CheckResult): Boolean {
        require(monitor.resendAfter != null && monitor.status == MonitorStatus.DOWN)
        return (checkResult.timesRetried ?: 1) % monitor.resendAfter!! == 1L
    }

    /*
     * Helper logging methods to keep logging logic consistent and concise.
     */
    private fun logNoNotificationNeeded(checkResult: CheckResult, reason: String) {
        checkResultLogEntryService.action(
            stage = CheckResultLogStage.NOTIFICATION,
            checkResult = checkResult,
            message = reason,
            properties = mapOf("result" to false.toString()),
        )
    }

    private fun logMonitorHasResendingEnabled(checkResult: CheckResult, resendAfter: Long) {
        checkResultLogEntryService.action(
            stage = CheckResultLogStage.NOTIFICATION,
            checkResult = checkResult,
            message = "Monitor has resending enabled. resend after ${resendAfter}x times",
        )
    }

    private fun logResendDownNotification(checkResult: CheckResult, resendNotification: Boolean) {
        checkResultLogEntryService.action(
            stage = CheckResultLogStage.NOTIFICATION,
            checkResult = checkResult,
            message = "Re-queuing DOWN notifications",
            properties = mapOf("result" to resendNotification.toString()),
        )
    }

    private fun logSendNormalNotification(
        checkResult: CheckResult,
        updatedMonitor: Monitor,
        oldStatus: MonitorStatus
    ) {
        checkResultLogEntryService.action(
            stage = CheckResultLogStage.NOTIFICATION,
            checkResult = checkResult,
            message = "Queuing ${updatedMonitor.status.name.uppercase()} notifications",
        )
        logger.info(
            """Monitor "{}", new status: "{}", previous status: "{}", sending normal notifications""",
            updatedMonitor.name,
            updatedMonitor.status,
            oldStatus,
        )
    }
}

/**
 * Indicates if the queue pickup was too late (exceeding [QUEUE_MONITOR_TIMEOUT_SECONDS]).
 */
private fun CheckResult.isPickedUpTooLate(): Boolean =
    Instant.now().minusSeconds(QUEUE_MONITOR_TIMEOUT_SECONDS).isAfter(createdAt)

/**
 * Handles marking the [CheckResult] as DOWN if picked up too late.
 */
private fun CheckResult.handleLatePickup() {
    status = MonitorStatus.DOWN
    title = "Monitor health check was picked up too late."
    message = """
        |Created at: $createdAt
        |Picked up at: $pickedUpAt
        |Difference: ${Duration.between(createdAt, pickedUpAt).toMillis()}ms
    """.trimMargin()
}

/**
 * Handles marking the [CheckResult] as monitor’s current status when paused or in maintenance.
 */
private fun CheckResult.handlePausedOrMaintenance() {
    status = monitor.status
    title = "Monitor ${monitor.status.name.uppercase()}"
}

/**
 * Checks if this is the first UP result after the server starts (i.e. from PENDING).
 */
private fun Monitor.isFirstUpResultAfterBoot(previousStatus: MonitorStatus): Boolean =
    (previousStatus == MonitorStatus.PENDING && this.status == MonitorStatus.UP)
