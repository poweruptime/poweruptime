package org.poweruptime.backend.features.monitor.checker

import io.github.oshai.kotlinlogging.KotlinLogging
import org.poweruptime.backend.features.monitor.core.TimeOption
import org.poweruptime.backend.features.monitor.dto.CheckResultResponse
import org.poweruptime.backend.features.monitor.dto.MonitorFullResponse
import org.poweruptime.backend.features.monitor.dto.PushCheckResultDto
import org.poweruptime.backend.features.monitor.dto.PushMonitorDto
import org.poweruptime.backend.features.monitor.dto.PushNotificationDto
import org.poweruptime.backend.features.monitor.model.CheckResultJoinMonitorAndTeamRecord
import org.poweruptime.backend.features.monitor.model.CheckResultLogStage
import org.poweruptime.backend.features.monitor.model.CheckResultRecord
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.resource.LAST_CHECK_RESULTS_COUNT
import org.poweruptime.backend.features.monitor.service.CheckResultLogEntryService
import org.poweruptime.backend.features.monitor.service.CheckResultStatisticsService
import org.poweruptime.backend.features.monitor.service.MonitorDataService
import org.poweruptime.backend.features.monitor.service.myFormat
import org.poweruptime.backend.features.notification.dto.NotificationResponse
import org.poweruptime.backend.features.notification.model.SubNotificationJoinMethodRecord
import org.poweruptime.backend.features.notification.service.NotificationMethodService
import org.poweruptime.backend.features.notification.service.NotificationService
import org.poweruptime.backend.features.notification.service.SubNotificationService
import org.poweruptime.backend.features.push.PushService
import org.poweruptime.backend.features.tag.TagService
import org.poweruptime.backend.features.team.model.TeamRecord
import org.springframework.stereotype.Component

@Component
class MonitorNotificationHandler(
    private val notificationService: NotificationService,
    private val subNotificationService: SubNotificationService,
    private val pushService: PushService,
    private val checkResultLogEntryService: CheckResultLogEntryService,
    private val monitorDataService: MonitorDataService,
    private val notificationMethodService: NotificationMethodService,
    private val tagService: TagService,
    private val checkResultStatisticsService: CheckResultStatisticsService,
) {
    private val logger = KotlinLogging.logger {}

    /**
     * Sends push for new check result.
     */
    fun sendCheckResultPush(checkResult: CheckResultRecord, monitor: MonitorRecord, team: TeamRecord) {
        logger.info { "Send push new check result for team '${team.id}'" }

        val joinRecord = CheckResultJoinMonitorAndTeamRecord(
            checkResult = checkResult,
            monitor = monitor,
            team = team,
        )

        pushService.send(
            team.id,
            PushCheckResultDto(checkResult = CheckResultResponse(joinRecord)),
        )

        checkResultLogEntryService.info(
            stage = CheckResultLogStage.CHECK,
            checkResultId = checkResult.id,
            message = "Sent result to subscribed clients",
        )
    }

    /**
     * Sends push if monitor status changed.
     */
    fun sendMonitorStatusPushIfChanged(
        monitor: MonitorRecord,
        team: TeamRecord,
        oldStatus: MonitorStatus
    ) {
        if (monitor.status != oldStatus) {
            logger.debug { "Send push status change for team '${team.id}'" }

            pushService.send(
                team.id,
                PushMonitorDto(monitor = monitor.toFullResponse(team)),
            )
        }
    }

    /**
     * Decides if notifications should be sent and creates them if so.
     * Returns sub-notifications to queue.
     * MUST be called in a transaction.
     */
    fun handleNotifications(
        monitor: MonitorRecord,
        checkResult: CheckResultRecord,
        team: TeamRecord,
        oldMonitorStatus: MonitorStatus,
        context: MonitorCheckContext
    ): List<SubNotificationJoinMethodRecord>? {
        val decision = decideNotificationAction(monitor, checkResult, oldMonitorStatus, context)

        logNotificationDecision(checkResult.id, decision)

        return when (decision) {
            is NotificationAction.Send -> createAndSendNotification(monitor, checkResult, team, decision)
            is NotificationAction.Skip -> null
        }
    }

    private fun decideNotificationAction(
        monitor: MonitorRecord,
        checkResult: CheckResultRecord,
        oldStatus: MonitorStatus,
        context: MonitorCheckContext
    ): NotificationAction {
        // First UP after boot - skip
        if (context.isFirstCheckAfterBoot && monitor.status == MonitorStatus.UP) {
            return NotificationAction.Skip("First up result after monitor or server start, not queuing notifications")
        }

        // Status changed - send
        if (oldStatus != monitor.status) {
            return NotificationAction.Send(
                reason = "Status changed from $oldStatus to ${monitor.status}",
                isResend = false,
            )
        }

        // Resend logic for DOWN status
        if (monitor.resendAfter != null &&
            oldStatus == monitor.status &&
            monitor.status == MonitorStatus.DOWN
        ) {
            requireNotNull(checkResult.timesRetried) { "timesRetried must be set for DOWN checks" }

            val shouldResend = checkResult.timesRetried!! % monitor.resendAfter == 1L

            return if (shouldResend) {
                NotificationAction.Send(
                    reason = "Resend scheduled after ${monitor.resendAfter}x times",
                    isResend = true,
                )
            } else {
                val remaining = monitor.resendAfter - (checkResult.timesRetried!! % monitor.resendAfter) - 1
                NotificationAction.Skip("Resend not due ($remaining checks remaining until next resend)")
            }
        }

        // Duplicate status without resending
        return NotificationAction.Skip("Duplicate status, not queuing notifications")
    }

    private fun createAndSendNotification(
        monitor: MonitorRecord,
        checkResult: CheckResultRecord,
        team: TeamRecord,
        decision: NotificationAction.Send
    ): List<SubNotificationJoinMethodRecord> {
        val notificationJoin = notificationService.send(monitor.id, checkResult)
        val subNotifications = subNotificationService.getByNotificationId(notificationJoin.notification.id)

        pushService.send(
            team.id,
            PushNotificationDto(notification = NotificationResponse(notificationJoin)),
        )

        logger.info {
            "Monitor '${monitor.name}', new status: '${monitor.status}', " +
                "sending ${if (decision.isResend) "resend" else "normal"} notifications"
        }

        return subNotifications
    }

    private fun MonitorRecord.toFullResponse(team: TeamRecord) = MonitorFullResponse(
        monitor = this,
        data = monitorDataService.findByIdAndType(id, type),
        team = team,
        notificationMethods = notificationMethodService.getByMonitorId(id),
        tags = tagService.getByMonitorId(id),
        uptime = checkResultStatisticsService.uptimeStatisticsDto(id),
        lastCheckResults = checkResultStatisticsService.getLastByMonitorId(id, LAST_CHECK_RESULTS_COUNT),
        oneDayUptime = checkResultStatisticsService.calculateRecentUptimeByMonitorId(
            monitorId = id,
            TimeOption.ONE_DAY,
        ).myFormat(),
    )

    private fun logNotificationDecision(checkResultId: ULong, decision: NotificationAction) {
        when (decision) {
            is NotificationAction.Send -> {
                checkResultLogEntryService.action(
                    stage = CheckResultLogStage.NOTIFICATION,
                    checkResultId = checkResultId,
                    message = if (decision.isResend) {
                        "Re-queuing DOWN notifications (${decision.reason})"
                    } else {
                        "Queuing notifications (${decision.reason})"
                    },
                    properties = mapOf("result" to true.toString()),
                )
            }
            is NotificationAction.Skip -> {
                checkResultLogEntryService.action(
                    stage = CheckResultLogStage.NOTIFICATION,
                    checkResultId = checkResultId,
                    message = decision.reason,
                    properties = mapOf("result" to false.toString()),
                )
            }
        }
    }

    private sealed class NotificationAction {
        data class Send(val reason: String, val isResend: Boolean) : NotificationAction()
        data class Skip(val reason: String) : NotificationAction()
    }
}
