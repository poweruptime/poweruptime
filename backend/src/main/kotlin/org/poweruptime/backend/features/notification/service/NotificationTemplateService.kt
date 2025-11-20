package org.poweruptime.backend.features.notification.service

import org.poweruptime.backend.core.utils.DateTimeUtils
import org.poweruptime.backend.features.HostService
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.notification.dto.NotificationTemplate
import org.poweruptime.backend.features.notification.model.SubNotificationJoinMethodNotificationCheckResultAndMonitorRecord
import org.poweruptime.backend.features.team.service.TeamSettingService
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.stereotype.Service
import org.thymeleaf.TemplateEngine
import org.thymeleaf.context.Context
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
        subNotificationJoin: SubNotificationJoinMethodNotificationCheckResultAndMonitorRecord
    ): NotificationTemplate {
        val context = Context().applyContext(subNotificationJoin)

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

    private fun Context.applyContext(
        subNotificationJoin: SubNotificationJoinMethodNotificationCheckResultAndMonitorRecord
    ) = apply {
        setVariable("monitorName", subNotificationJoin.monitor.name)
        setVariable(
            "status",
            when (subNotificationJoin.checkResult.status) {
                MonitorStatus.UP -> """✅ UP"""
                MonitorStatus.DOWN -> """🔴 DOWN"""
                else -> throw InvalidAttributesException(
                    "Check result status not allowed to be ${subNotificationJoin.checkResult.status}",
                )
            },
        )
        setVariable("title", subNotificationJoin.subNotification.title)
        setVariable(
            "checkStartedAt",
            subNotificationJoin.checkResult.pickedUpAt
                ?.atZone(teamSettingService.getTimeZone(subNotificationJoin.monitor.teamId))
                ?.format(DateTimeUtils.dateTimeFormatter),
        )
        setVariable("pingMs", subNotificationJoin.checkResult.pingMs)
        setVariable("message", subNotificationJoin.subNotification.message)
        setVariable(
            "checkResultLink",
            "${hostService.urlHost}/m/${subNotificationJoin.monitor.id}/c/${
                subNotificationJoin.notification.id}/logs",
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
}
