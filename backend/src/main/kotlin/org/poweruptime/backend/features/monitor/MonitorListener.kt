package org.poweruptime.backend.features.monitor

import io.github.oshai.kotlinlogging.KotlinLogging
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.jetbrains.exposed.v1.jdbc.update
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
import org.poweruptime.backend.features.monitor.model.CheckResultJoinMonitorAndTeamRecord
import org.poweruptime.backend.features.monitor.model.CheckResultJoinMonitorRecord
import org.poweruptime.backend.features.monitor.model.CheckResultLogStage
import org.poweruptime.backend.features.monitor.model.CheckResultRecord
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.resource.LAST_CHECK_RESULTS_COUNT
import org.poweruptime.backend.features.monitor.service.CheckResultLogEntryService
import org.poweruptime.backend.features.monitor.service.CheckResultService
import org.poweruptime.backend.features.monitor.service.CheckResultStatisticsService
import org.poweruptime.backend.features.monitor.service.MonitorDataService
import org.poweruptime.backend.features.monitor.service.MonitorService
import org.poweruptime.backend.features.monitor.service.myFormat
import org.poweruptime.backend.features.notification.dto.NotificationResponse
import org.poweruptime.backend.features.notification.model.NotificationRecord
import org.poweruptime.backend.features.notification.model.SubNotificationJoinMethodRecord
import org.poweruptime.backend.features.notification.service.NotificationMethodService
import org.poweruptime.backend.features.notification.service.NotificationService
import org.poweruptime.backend.features.notification.service.SubNotificationService
import org.poweruptime.backend.features.push.PushService
import org.poweruptime.backend.features.tag.TagService
import org.poweruptime.backend.features.team.model.TeamRecord
import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.stereotype.Component
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
    private val monitorDataService: MonitorDataService,
    private val tagService: TagService,
    private val notificationMethodService: NotificationMethodService,
    private val notificationService: NotificationService,
    private val subNotificationService: SubNotificationService,
    private val pushService: PushService,
) {
    private final val logger = KotlinLogging.logger {}

    /**
     * Receives messages from "monitor-queue" and processes [CheckResultRecord] by ID.
     */
    @RabbitListener(queues = [MONITOR_QUEUE])
    fun monitorQueueConsumer(checkResultId: String) {
        val checkResultId = checkResultId.toULong()
        val subNotifications = transaction {
            run(checkResultId).also {
                this@transaction.commit()
            }
        }

        subNotifications?.forEach { subNotificationJoin ->
            subNotificationService.queueNotification(subNotificationJoin.subNotification.id)

            checkResultLogEntryService.info(
                stage = CheckResultLogStage.NOTIFICATION,
                checkResultId = checkResultId,
                message = """Queued "${subNotificationJoin.method.name}" notification""",
                properties = mapOf("subNotificationId" to subNotificationJoin.subNotification.publicId),
            )
        }
    }

    private fun run(checkResultId: ULong): List<SubNotificationJoinMethodRecord>? {
        val checkResultJoinMonitorAndTeam = checkResultService.getByIdJoinMonitorAndTeam(checkResultId.toULong())
        val checkResult = checkResultJoinMonitorAndTeam.checkResult
        val monitor = checkResultJoinMonitorAndTeam.monitor
        val team = checkResultJoinMonitorAndTeam.team

        logger.debug { "Received monitor check '${checkResult.id}' of monitor '${monitor.name}'" }

        // Perform the actual check and persist the updated CheckResult
        val updatedCheckJoinMonitorAndTeam = checkResultJoinMonitorAndTeam.performCheck()

        // Notify subscribed clients about the new check result
        updatedCheckJoinMonitorAndTeam.sendNewCheckResultPush(team.id)

        // Attempt to update the monitor’s status if needed
        val oldStatus = monitor.status
        val updatedMonitor = monitor.updateMonitorStatusIfUpOrDown(updatedCheckJoinMonitorAndTeam.checkResult)

        // If the monitor status changed, send a monitor status change push
        sendStatusChangePushIfNeeded(updatedMonitor, team, oldStatus)

        // Send notifications (UP / DOWN) if required
        return updatedMonitor.sendUpOrDownNotifications(updatedCheckJoinMonitorAndTeam.checkResult, team.id, oldStatus)
    }

    /**
     * Performs the actual check, including handling late pickup, paused/maintenance, and running the checker.
     */
    @Suppress("LongMethod")
    private fun CheckResultJoinMonitorRecord.performCheck(): CheckResultJoinMonitorAndTeamRecord = apply {
        checkResult.pickedUpAt = Instant.now()

        val previousCheck = checkResult.getPrevious()
        checkResult.previousStatus = previousCheck?.status ?: monitor.status

        // 1) Handle late pickup
        val isPickedUpTooLate = checkResult.isPickedUpTooLate()
        checkResultLogEntryService.action(
            stage = CheckResultLogStage.SETUP,
            checkResultId = this.checkResult.id,
            message = "Job picked up in time",
            properties = mapOf(
                "result" to (!isPickedUpTooLate).toString(),
                "time" to Duration.between(checkResult.createdAt, checkResult.pickedUpAt!!).toMillis().toString(),
            ),
        )
        if (isPickedUpTooLate) {
            checkResult.handleLatePickup()

            logger.error { "Monitor check '${checkResult.id}' was picked up too late" }

            return@apply
        }

        // 2) Check if monitor is paused or in maintenance
        val isPausedOrInMaintenance = monitor.status in listOf(MonitorStatus.PAUSED, MonitorStatus.MAINTENANCE)

        checkResultLogEntryService.action(
            stage = CheckResultLogStage.CHECK,
            checkResultId = this.checkResult.id,
            message = "Monitor not paused or in maintenance",
            properties = mapOf("result" to (!isPausedOrInMaintenance).toString()),
        )
        if (isPausedOrInMaintenance) {
            checkResult.handlePausedOrMaintenance(monitor)
            return@apply
        }

        // 3) Execute the actual check logic
        val (pingMsValue, isUp, titleStr, messageStr) = monitorCheckerFactory.execute(monitor)

        checkResult.status = if (isUp.adjustForUpsideDown(monitor.upsideDown)) MonitorStatus.UP else MonitorStatus.DOWN
        checkResult.checkedAt = Instant.now()
        checkResult.pingMs = pingMsValue
        checkResult.title = titleStr.abbreviate(Database.MAX_TITLE_LENGTH)
        checkResult.message = messageStr?.abbreviate(Database.MAX_MESSAGE_LENGTH)

        // If DOWN, increment retry count
        if (checkResult.status == MonitorStatus.DOWN) {
            checkResult.timesRetried = (previousCheck?.timesRetried ?: 0) + 1
        }

        checkResultLogEntryService.action(
            stage = CheckResultLogStage.CHECK,
            checkResultId = this.checkResult.id,
            message = "Performing uptime check",
            properties = mapOf(
                "result" to isUp.adjustForUpsideDown(monitor.upsideDown).toString(),
                "time" to pingMsValue.toString(),
            ),
        )
    }.run {
        require(checkResult.status != MonitorStatus.PENDING) { "Check result must not remain PENDING." }
        requireNotNull(checkResult.pickedUpAt) { "Check result pickedUpAt must not be null." }
        requireNotNull(checkResult.previousStatus) { "Check result previousStatus must not be null." }

        val updatedCheck = CheckResult.update({ CheckResult.id eq checkResult.id }) {
            it[CheckResult.status] = checkResult.status
            it[CheckResult.timesRetried] = checkResult.timesRetried
            it[CheckResult.previousStatus] = checkResult.previousStatus
            it[CheckResult.pickedUpAt] = checkResult.pickedUpAt
            it[CheckResult.checkedAt] = checkResult.checkedAt
            it[CheckResult.pingMs] = checkResult.pingMs
            it[CheckResult.title] = checkResult.title
            it[CheckResult.message] = checkResult.message
        }.let {
            checkResultService.getByIdJoinMonitorAndTeam(checkResult.id)
        }

        checkResultLogEntryService.info(
            stage = CheckResultLogStage.CHECK,
            checkResultId = updatedCheck.checkResult.id,
            message = "Sent result to subscribed clients",
        )

        return updatedCheck
    }

    /**
     * Send a push notification for the new check result.
     */
    private fun CheckResultJoinMonitorAndTeamRecord.sendNewCheckResultPush(teamId: ULong) {
        logger.info { "Send push new check result for team '$teamId'" }
        pushService.send(
            teamId,
            PushCheckResultDto(checkResult = CheckResultResponse(this)),
        )
    }

    /**
     * Attempts to update the [MonitorRecord]'s status if it is UP or DOWN; returns the updated monitor.
     */
    private fun MonitorRecord.updateMonitorStatusIfUpOrDown(updatedCheck: CheckResultRecord): MonitorRecord {
        return when (updatedCheck.status) {
            MonitorStatus.UP, MonitorStatus.DOWN -> {
                val successfulUpdatedMonitor = monitorService.updateStatus(
                    id,
                    determineUpdatedMonitorStatus(updatedCheck),
                ) > 0

                val updatedMonitor = if (successfulUpdatedMonitor) {
                    monitorService.getById(id)
                } else {
                    logger.warn {
                        "Monitor '$name', was updated after receiving it for processing. " +
                            "Could not persist to db. Continuing with not-persisted monitor"
                    }
                    this
                }

                checkResultLogEntryService.action(
                    stage = CheckResultLogStage.MONITOR_STATUS_UPDATE,
                    checkResultId = updatedCheck.id,
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
    private fun sendStatusChangePushIfNeeded(
        updatedMonitor: MonitorRecord,
        team: TeamRecord,
        oldStatus: MonitorStatus
    ) {
        if (oldStatus != updatedMonitor.status) {
            logger.debug { "Send push status change for team '${team.id}'" }

            pushService.send(
                team.id,
                PushMonitorDto(monitor = updatedMonitor.toFullResponse(team)),
            )
        }
    }

    private fun MonitorRecord.toFullResponse(team: TeamRecord) = MonitorFullResponse(
        monitor = this,
        data = monitorDataService.findByIdAndType(this.id, this.type),
        team = team,
        notificationMethods = notificationMethodService.getByMonitorId(this.id),
        tags = tagService.getByMonitorId(this.id),
        uptime = checkResultStatisticsService.uptimeStatisticsDto(this.id),
        lastCheckResults = checkResultStatisticsService.getLastByMonitorId(this.id, LAST_CHECK_RESULTS_COUNT),
        oneDayUptime = checkResultStatisticsService.calculateRecentUptimeByMonitorId(
            monitorId = this.id,
            TimeOption.ONE_DAY,
        ).myFormat(),
    )

    /**
     * Decides if and sends a UP or DOWN notification. Also checks for resend logic.
     */
    private fun MonitorRecord.sendUpOrDownNotifications(
        checkResult: CheckResultRecord,
        teamId: ULong,
        oldStatus: MonitorStatus
    ): List<SubNotificationJoinMethodRecord>? {
        fun sendNotification(): Pair<NotificationRecord, List<SubNotificationJoinMethodRecord>> {
            val notificationJoinCheckResultMonitorAndTeam = notificationService.send(this.id, checkResult)
            val subNotifications = subNotificationService.getByNotificationId(
                notificationJoinCheckResultMonitorAndTeam.notification.id,
            )
            pushService.send(
                teamId,
                PushNotificationDto(notification = NotificationResponse(notificationJoinCheckResultMonitorAndTeam)),
            )

            return Pair(notificationJoinCheckResultMonitorAndTeam.notification, subNotifications)
        }

        return when {
            isFirstUpResultAfterBoot(oldStatus) -> {
                logNoNotificationNeeded(
                    checkResult.id,
                    reason = "First up result after server start, not queuing notifications",
                )

                null
            }
            // Monitor has resending enabled, the status is the same as before and DOWN
            resendAfter != null &&
                oldStatus == status &&
                status == MonitorStatus.DOWN -> {
                logMonitorHasResendingEnabled(checkResult.id, resendAfter)
                val resendNotification = shouldResendNotification(this, checkResult)

                val notificationAndSubNotifications = if (resendNotification) sendNotification() else null

                logResendDownNotification(checkResult.id, resendNotification, notificationAndSubNotifications?.first)

                notificationAndSubNotifications?.second
            }
            oldStatus != status -> {
                val (notification, subNotifications) = sendNotification()
                logSendNormalNotification(checkResult.id, this, oldStatus, notification)

                subNotifications
            }
            else -> {
                // Duplicate status without resending
                require(oldStatus == status)
                logNoNotificationNeeded(
                    checkResult.id,
                    reason = "Duplicate status, not queuing notifications",
                )

                null
            }
        }
    }

    /**
     * Decides new [MonitorRecord.status] based on the [CheckResultRecord].
     *
     * Marks a [MonitorRecord] as DOWN only when retries are exhausted, or immediately if the monitor
     * was PENDING (first check after server start).
     */
    private fun MonitorRecord.determineUpdatedMonitorStatus(checkResult: CheckResultRecord): MonitorStatus {
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
                        checkResultId = checkResult.id,
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
                            checkResultId = checkResult.id,
                            message = "Retry limit exceeded: $timesRetried attempt${
                                if (timesRetried != 1L) "s" else ""
                            } made, but the maximum allowed retries is ${retries ?: MONITOR_DEFAULT_RETRY}",
                        )
                        MonitorStatus.DOWN
                    } else {
                        checkResultLogEntryService.info(
                            stage = CheckResultLogStage.MONITOR_STATUS_UPDATE,
                            checkResultId = checkResult.id,
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
     * Extension function on [CheckResultRecord] to retrieve the previous result for the same monitor.
     */
    private fun CheckResultRecord.getPrevious(): CheckResultRecord? {
        return checkResultStatisticsService
            .getLastByMonitorId(monitorId, 2)
            .firstOrNull { it.id != this.id }
    }

    /**
     * Determines if we need to re-send notifications (only relevant for DOWN status and resendAfter enabled).
     */
    private fun shouldResendNotification(monitor: MonitorRecord, checkResult: CheckResultRecord): Boolean {
        requireNotNull(monitor.resendAfter)
        requireNotNull(checkResult.timesRetried)
        require(monitor.status == MonitorStatus.DOWN)

        return checkResult.timesRetried!! % monitor.resendAfter == 1L
    }

    /*
     * Helper logging methods to keep logging logic consistent and concise.
     */
    private fun logNoNotificationNeeded(checkResultId: ULong, reason: String) {
        checkResultLogEntryService.action(
            stage = CheckResultLogStage.NOTIFICATION,
            checkResultId = checkResultId,
            message = reason,
            properties = mapOf("result" to false.toString()),
        )
    }

    private fun logMonitorHasResendingEnabled(checkResultId: ULong, resendAfter: Long) {
        checkResultLogEntryService.action(
            stage = CheckResultLogStage.NOTIFICATION,
            checkResultId = checkResultId,
            message = "Monitor has resending enabled. resend after ${resendAfter}x times",
        )
    }

    private fun logResendDownNotification(
        checkResultId: ULong,
        resendNotification: Boolean,
        notification: NotificationRecord?
    ) {
        checkResultLogEntryService.action(
            stage = CheckResultLogStage.NOTIFICATION,
            checkResultId = checkResultId,
            message = "Re-queuing DOWN notifications",
            properties = buildMap {
                set("result", resendNotification.toString())
                notification?.publicId?.let {
                    set("notificationId", it)
                }
            },
        )
    }

    private fun logSendNormalNotification(
        checkResultId: ULong,
        updatedMonitor: MonitorRecord,
        oldStatus: MonitorStatus,
        notification: NotificationRecord
    ) {
        checkResultLogEntryService.action(
            stage = CheckResultLogStage.NOTIFICATION,
            checkResultId = checkResultId,
            message = "Queuing ${updatedMonitor.status.name.uppercase()} notifications",
            properties = mapOf("notificationId" to notification.publicId),
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
private fun CheckResultRecord.isPickedUpTooLate(): Boolean {
    requireNotNull(pickedUpAt) { "pickedUpAt is set a step before this" }
    return pickedUpAt!!.minusSeconds(QUEUE_MONITOR_TIMEOUT_SECONDS).isAfter(createdAt)
}

/**
 * Handles marking the [CheckResultRecord] as DOWN if picked up too late.
 */
private fun CheckResultRecord.handleLatePickup() {
    status = MonitorStatus.DOWN
    title = "Monitor health check was picked up too late."
    message = """
        |Created at: $createdAt
        |Picked up at: $pickedUpAt
        |Difference: ${Duration.between(createdAt, pickedUpAt).toMillis()}ms
    """.trimMargin()
}

/**
 * Handles marking the [CheckResultRecord] as monitor’s current status when paused or in maintenance.
 */
private fun CheckResultRecord.handlePausedOrMaintenance(monitor: MonitorRecord) {
    status = monitor.status
    title = "Monitor ${monitor.status.name.uppercase()}"
}

/**
 * Checks if this is the first UP result after the server starts (i.e. from PENDING).
 */
private fun MonitorRecord.isFirstUpResultAfterBoot(previousStatus: MonitorStatus): Boolean =
    (previousStatus == MonitorStatus.PENDING && this.status == MonitorStatus.UP)
