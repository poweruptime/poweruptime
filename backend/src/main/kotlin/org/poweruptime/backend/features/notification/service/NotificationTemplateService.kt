package org.poweruptime.backend.features.notification.service

import org.poweruptime.backend.core.utils.DateTimeUtils
import org.poweruptime.backend.features.HostService
import org.poweruptime.backend.features.monitor.model.CheckResultRecord
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.notification.dto.NotificationTemplate
import org.poweruptime.backend.features.notification.model.SubNotificationJoinMethodNotificationCheckResultAndMonitorRecord
import org.poweruptime.backend.features.team.service.TeamSettingService
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.stereotype.Service
import org.thymeleaf.TemplateEngine
import org.thymeleaf.context.Context
import java.time.Duration
import javax.naming.directory.InvalidAttributesException

const val OPENING_SQUARE_BRACKET_REPLACEMENT_CHAR = "¼"
const val CLOSING_SQUARE_BRACKET_REPLACEMENT_CHAR = "½"

@Service
class NotificationTemplateService(
    @Qualifier("textTemplateEngine") private val templateEngine: TemplateEngine,
    private val teamSettingService: TeamSettingService,
    private val hostService: HostService,
) {
    fun getRenderedNotification(
        subNotificationJoin: SubNotificationJoinMethodNotificationCheckResultAndMonitorRecord,
        previousOppositeCheckResult: CheckResultRecord? = null
    ): NotificationTemplate {
        val context = subNotificationJoin.toContext(previousOppositeCheckResult)

        return NotificationTemplate(
            title = (subNotificationJoin.method.titleTemplate ?: subNotificationJoin.method.type.titleTemplate).render(
                context,
            ),
            body = (subNotificationJoin.method.bodyTemplate ?: subNotificationJoin.method.type.bodyTemplate).render(
                context,
            ),
        )
    }

    private fun String.render(context: Context): String = templateEngine
        .process(replaceCustomVariablesWithThymeleafVariables(context), context)
        .replaceThymeleafReplacementSquareBrackets()

    private fun SubNotificationJoinMethodNotificationCheckResultAndMonitorRecord.toContext(
        previousOppositeCheckResult: CheckResultRecord?
    ) = Context().apply {
        setVariable("monitorName", monitor.name)
        setVariable(
            "status",
            when (checkResult.status) {
                MonitorStatus.UP -> """✅ UP"""
                MonitorStatus.DOWN -> """🔴 DOWN"""
                else -> throw InvalidAttributesException(
                    "Check result status not allowed to be ${checkResult.status}",
                )
            },
        )
        setVariable("title", subNotification.title)
        setVariable(
            "checkStartedAt",
            checkResult.pickedUpAt
                ?.atZone(teamSettingService.getTimeZone(monitor.teamId))
                ?.format(DateTimeUtils.dateTimeFormatter),
        )
        setVariable("pingMs", checkResult.pingMs)
        setVariable("message", subNotification.message)
        setVariable(
            "checkResultLink",
            "${hostService.urlHost}/m/${monitor.id}/c/${
                notification.id}/logs",
        )

        previousOppositeCheckResult?.let {
            setVariable(
                "previousStatusLabel",
                when {
                    checkResult.isResend(monitor) -> checkResult.status.toStatusLabel()
                    else -> it.status.toStatusLabel()
                },
            )
            setVariable(
                "previousStatusDuration",
                Duration.between(
                    it.pickedUpAt,
                    checkResult.pickedUpAt,
                ).toHumanReadableString(),
            )
        }
    }

    private fun CheckResultRecord.isResend(monitor: MonitorRecord): Boolean = monitor.resendAfter != null &&
        status == MonitorStatus.DOWN &&
        timesRetried != null &&
        status == previousStatus &&
        timesRetried!! % monitor.resendAfter == 1L

    private fun MonitorStatus.toStatusLabel() = when (this) {
        MonitorStatus.UP -> """Online"""
        MonitorStatus.DOWN -> """Offline"""
        else -> throw InvalidAttributesException(
            "Last inverted check result status not allowed to be $this",
        )
    }

    private fun String.replaceCustomVariablesWithThymeleafVariables(context: Context): String {
        var template = replaceNoneThymeleafSquareBrackets()

        context.variableNames.forEach {
            template = template.replace("!$it", "[[\${$it}]]")
        }

        return template
    }

    private fun String.replaceNoneThymeleafSquareBrackets() =
        this.replace("\\[".toRegex(), OPENING_SQUARE_BRACKET_REPLACEMENT_CHAR)
            .replace("]", CLOSING_SQUARE_BRACKET_REPLACEMENT_CHAR)

    private fun String.replaceThymeleafReplacementSquareBrackets() =
        this.replace(OPENING_SQUARE_BRACKET_REPLACEMENT_CHAR, "[")
            .replace(CLOSING_SQUARE_BRACKET_REPLACEMENT_CHAR, "]")
            .replace("&quot;", "\"")

    fun Duration.toHumanReadableString(): String {
        var totalSeconds = seconds

        val months = totalSeconds / (30L * 24 * 3600)
        totalSeconds %= 30L * 24 * 3600

        val days = totalSeconds / (24 * 3600)
        totalSeconds %= 24 * 3600

        val hours = totalSeconds / 3600
        totalSeconds %= 3600

        val minutes = totalSeconds / 60
        val seconds = totalSeconds % 60

        val parts = mutableListOf<String>()
        if (months > 0) parts += "${months}mo"
        if (days > 0) parts += "${days}d"
        if (hours > 0) parts += "${hours}h"
        if (minutes > 0) parts += "${minutes}m"
        if (seconds > 0 || parts.isEmpty()) parts += "${seconds}s"

        return parts.joinToString(" ")
    }
}
