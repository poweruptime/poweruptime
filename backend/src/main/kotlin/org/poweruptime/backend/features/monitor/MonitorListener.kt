package org.poweruptime.backend.features.monitor

import io.github.oshai.kotlinlogging.KotlinLogging
import org.poweruptime.backend.amqp.RabbitMQ.MONITOR_QUEUE
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.abbreviate
import org.poweruptime.backend.features.monitor.core.MonitorCheckerFactory
import org.poweruptime.backend.features.monitor.core.TimeOption
import org.poweruptime.backend.features.monitor.dto.CheckResultResponse
import org.poweruptime.backend.features.monitor.dto.MonitorFullResponse
import org.poweruptime.backend.features.monitor.dto.PushCheckResultDto
import org.poweruptime.backend.features.monitor.dto.PushMonitorDto
import org.poweruptime.backend.features.monitor.dto.PushNotificationDto
import org.poweruptime.backend.features.monitor.model.CheckResult
import org.poweruptime.backend.features.monitor.model.CheckResultLogStage
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.resource.LAST_CHECK_RESULTS_COUNT
import org.poweruptime.backend.features.monitor.service.CheckResultLogEntryService
import org.poweruptime.backend.features.monitor.service.CheckResultService
import org.poweruptime.backend.features.monitor.service.CheckResultStatisticsService
import org.poweruptime.backend.features.monitor.service.MonitorService
import org.poweruptime.backend.features.monitor.service.myFormat
import org.poweruptime.backend.features.notification.dto.NotificationResponse
import org.poweruptime.backend.features.notification.model.Notification
import org.poweruptime.backend.features.notification.service.NotificationService
import org.poweruptime.backend.features.notification.service.SubNotificationService
import org.poweruptime.backend.features.push.PushService
import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Duration
import java.time.Instant

private const val QUEUE_MONITOR_TIMEOUT_SECONDS = 10L
private const val MONITOR_DEFAULT_RETRY = 1L

/**
 * Extension function to flip [Boolean] if [upsideDown] is true.
 */
private fun Boolean.adjustForUpsideDown(upsideDown: Boolean) = if (upsideDown) !this else this

@Component
class MonitorListener(
    private val checkResultService: CheckResultService,
    private val checkResultStatisticsService: CheckResultStatisticsService,
    private val checkResultLogEntryService: CheckResultLogEntryService,
    private val monitorService: MonitorService,
    private val monitorCheckerFactory: MonitorCheckerFactory,
    private val notificationService: NotificationService,
    private val subNotificationService: SubNotificationService,
    private val pushService: PushService,
) {
    private final val logger = KotlinLogging.logger {}

    /**
     * Receives messages from "monitor-queue" and processes [CheckResult] by ID.
     */
    @RabbitListener(queues = [MONITOR_QUEUE])
    @Transactional
    fun monitorQueueConsumer(monitorCheckId: String) {
        val checkResult = checkResultService.getByIdOrThrow(monitorCheckId)
        val monitor = checkResult.monitor

        logger.debug { "Received monitor check '${checkResult.id}' of monitor '${monitor.name}'" }

        // Perform the actual check and persist the updated CheckResult
        val updatedCheck = checkResult.performCheck()

        // Notify subscribed clients about the new check result
        updatedCheck.sendNewCheckResultPush()

        // Attempt to update the monitor’s status if needed
        val oldStatus = monitor.status
        val updatedMonitor = monitor.updateMonitorStatusIfUpOrDown(updatedCheck)

        // If the monitor status changed, send a monitor status change push
        updatedMonitor.sendStatusChangePushIfNeeded(oldStatus)

        // Send notifications (UP / DOWN) if required
        updatedMonitor.sendUpOrDownNotifications(oldStatus, updatedCheck)
    }

    /**
     * Performs the actual check, including handling late pickup, paused/maintenance, and running the checker.
     */
    @Suppress("LongMethod")
    private fun CheckResult.performCheck(): CheckResult = apply {
        pickedUpAt = Instant.now()

        val previousCheck = getPrevious()
        previousStatus = previousCheck?.status ?: monitor.status

        // 1) Handle late pickup
        val isPickedUpTooLate = isPickedUpTooLate()
        checkResultLogEntryService.action(
            stage = CheckResultLogStage.SETUP,
            checkResult = this,
            message = "Job picked up in time",
            properties = mapOf(
                "result" to (!isPickedUpTooLate).toString(),
                "time" to Duration.between(createdAt, pickedUpAt!!).toMillis().toString(),
            ),
        )
        if (isPickedUpTooLate) {
            handleLatePickup()

            logger.error { "Monitor check '$id' was picked up too late" }

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
    }.run {
        require(status != MonitorStatus.PENDING) { "Check result must not remain PENDING." }
        requireNotNull(pickedUpAt) { "Check result pickedUpAt must not be null." }
        requireNotNull(previousStatus) { "Check result previousStatus must not be null." }

        val updatedCheck = checkResultService.save(this)
        checkResultLogEntryService.info(
            stage = CheckResultLogStage.CHECK,
            checkResult = updatedCheck,
            message = "Sent result to subscribed clients",
        )

        return updatedCheck
    }

    /**
     * Send a push notification for the new check result.
     */
    private fun CheckResult.sendNewCheckResultPush() {
        logger.info { "Send push new check result for team '${monitor.team.id}'" }
        pushService.send(
            monitor.team.id,
            PushCheckResultDto(checkResult = CheckResultResponse(this)),
        )
    }

    /**
     * Attempts to update the [monitor]'s status if it is UP or DOWN; returns the updated monitor.
     */
    private fun Monitor.updateMonitorStatusIfUpOrDown(updatedCheck: CheckResult): Monitor {
        return when (updatedCheck.status) {
            MonitorStatus.UP, MonitorStatus.DOWN -> {
                val successfulUpdatedMonitor = monitorService.updateStatus(
                    id,
                    determineUpdatedMonitorStatus(updatedCheck),
                ) > 0

                val updatedMonitor = if (successfulUpdatedMonitor) {
                    monitorService.getByIdOrThrow(id)
                } else {
                    logger.warn {
                        "Monitor '$name', was updated after receiving it for processing. " +
                            "Could not persist to db. Continuing with not-persisted monitor"
                    }
                    this
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
                logger.info {
                    "Monitor '$name' is paused or in maintenance, status: '${updatedCheck.status}', " +
                        "not processing status change"
                }

                this
            }
        }
    }

    /**
     * Sends a push if the monitor status has changed from [oldStatus] to the new monitor status.
     */
    private fun Monitor.sendStatusChangePushIfNeeded(oldStatus: MonitorStatus) {
        if (oldStatus != status) {
            logger.debug { "Send push status change for team '${team.id}'" }

            pushService.send(
                team.id,
                PushMonitorDto(monitor = toFullResponse()),
            )
        }
    }

    private fun Monitor.toFullResponse() = MonitorFullResponse(
        this,
        uptime = checkResultStatisticsService.uptimeStatisticsDto(this),
        lastCheckResults = checkResultStatisticsService.getLastByMonitorId(this.id, LAST_CHECK_RESULTS_COUNT),
        oneDayUptime = checkResultStatisticsService.calculateRecentUptimeByMonitorId(
            this.id,
            TimeOption.ONE_DAY,
        ).myFormat(),
    )

    /**
     * Decides if and sends a UP or DOWN notification. Also checks for resend logic.
     */
    private fun Monitor.sendUpOrDownNotifications(
        oldStatus: MonitorStatus,
        checkResult: CheckResult
    ) {
        fun sendNotification(): Notification {
            val notification = notificationService.send(this, checkResult)
            notification.subNotifications.forEach { subNotification ->
                subNotificationService.queueNotification(subNotification.id)

                checkResultLogEntryService.info(
                    stage = CheckResultLogStage.NOTIFICATION,
                    checkResult = checkResult,
                    message = """Queued "${subNotification.method.name}" notification""",
                    properties = mapOf("subNotificationId" to subNotification.id),
                )
            }
            pushService.send(
                notification.checkResult.monitor.team.id,
                PushNotificationDto(notification = NotificationResponse(notification)),
            )

            return notification
        }

        when {
            isFirstUpResultAfterBoot(oldStatus) -> {
                logNoNotificationNeeded(
                    checkResult,
                    reason = "First up result after server start, not queuing notifications",
                )
            }
            // Monitor has resending enabled, the status is the same as before and DOWN
            resendAfter != null &&
                oldStatus == status &&
                status == MonitorStatus.DOWN -> {
                logMonitorHasResendingEnabled(checkResult, resendAfter!!)
                val resendNotification = shouldResendNotification(this, checkResult)

                val notification = if (resendNotification) sendNotification() else null

                logResendDownNotification(checkResult, resendNotification, notification)
            }
            oldStatus != status -> {
                val notification = sendNotification()
                logSendNormalNotification(checkResult, this, oldStatus, notification)
            }
            else -> {
                // Duplicate status without resending
                require(oldStatus == status)
                logNoNotificationNeeded(
                    checkResult,
                    reason = "Duplicate status, not queuing notifications",
                )
            }
        }
    }

    /**
     * Decides new [Monitor.status] based on the [CheckResult].
     *
     * Marks a [Monitor] as DOWN only when retries are exhausted, or immediately if the monitor
     * was PENDING (first check after server start).
     */
    private fun Monitor.determineUpdatedMonitorStatus(checkResult: CheckResult): MonitorStatus {
        return if (checkResult.status == MonitorStatus.UP) {
            MonitorStatus.UP
        } else {
            require(checkResult.status == MonitorStatus.DOWN) {
                "This function should only be called if the checkResult is DOWN."
            }

            return when {
                // Immediately mark as DOWN if it was previously PENDING
                status == MonitorStatus.PENDING -> {
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
                    if (timesRetried >= (retries ?: MONITOR_DEFAULT_RETRY)) {
                        checkResultLogEntryService.info(
                            stage = CheckResultLogStage.MONITOR_STATUS_UPDATE,
                            checkResult = checkResult,
                            message = "Retry limit exceeded: $timesRetried attempt${
                                if (timesRetried != 1L) "s" else ""
                            } made, but the maximum allowed retries is ${retries ?: MONITOR_DEFAULT_RETRY}",
                        )
                        MonitorStatus.DOWN
                    } else {
                        checkResultLogEntryService.info(
                            stage = CheckResultLogStage.MONITOR_STATUS_UPDATE,
                            checkResult = checkResult,
                            message = "Retry limit not reached: $timesRetried attempt" +
                                "${if (timesRetried != 1L) "s" else ""} (maximum allowed: " +
                                "${retries ?: MONITOR_DEFAULT_RETRY})",
                        )
                        MonitorStatus.UP
                    }
                }
                else -> MonitorStatus.DOWN
            }
        }
    }

    /**
     * Extension function on [CheckResult] to retrieve the previous result for the same monitor.
     */
    private fun CheckResult.getPrevious(): CheckResult? {
        return checkResultStatisticsService
            .getLastByMonitorId(monitor.id, 2)
            .firstOrNull { it.id != this.id }
    }

    /**
     * Determines if we need to re-send notifications (only relevant for DOWN status and resendAfter enabled).
     */
    private fun shouldResendNotification(monitor: Monitor, checkResult: CheckResult): Boolean {
        requireNotNull(monitor.resendAfter)
        requireNotNull(checkResult.timesRetried)
        require(monitor.status == MonitorStatus.DOWN)

        return checkResult.timesRetried!! % monitor.resendAfter!! == 1L
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

    private fun logResendDownNotification(
        checkResult: CheckResult,
        resendNotification: Boolean,
        notification: Notification?
    ) {
        checkResultLogEntryService.action(
            stage = CheckResultLogStage.NOTIFICATION,
            checkResult = checkResult,
            message = "Re-queuing DOWN notifications",
            properties = buildMap {
                set("result", resendNotification.toString())
                if (notification != null) {
                    set("notificationId", notification.id)
                }
            },
        )
    }

    private fun logSendNormalNotification(
        checkResult: CheckResult,
        updatedMonitor: Monitor,
        oldStatus: MonitorStatus,
        notification: Notification
    ) {
        checkResultLogEntryService.action(
            stage = CheckResultLogStage.NOTIFICATION,
            checkResult = checkResult,
            message = "Queuing ${updatedMonitor.status.name.uppercase()} notifications",
            properties = mapOf("notificationId" to notification.id),
        )
        logger.info {
            "Monitor '${updatedMonitor.name}', new status: '${updatedMonitor.status}', " +
                "previous status: '$oldStatus', sending normal notifications"
        }
    }
}

/**
 * Indicates if the queue pickup was too late (exceeding [QUEUE_MONITOR_TIMEOUT_SECONDS]).
 */
private fun CheckResult.isPickedUpTooLate(): Boolean {
    requireNotNull(pickedUpAt) { "pickedUpAt is set a step before this" }
    return pickedUpAt!!.minusSeconds(QUEUE_MONITOR_TIMEOUT_SECONDS).isAfter(createdAt)
}

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
