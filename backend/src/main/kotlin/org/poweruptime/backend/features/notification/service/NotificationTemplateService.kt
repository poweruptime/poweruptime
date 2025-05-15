package org.poweruptime.backend.features.notification.service

import org.poweruptime.backend.core.utils.DateTimeUtils
import org.poweruptime.backend.features.HostService
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.notification.dto.NotificationTemplate
import org.poweruptime.backend.features.notification.model.SubNotification
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
    fun getRenderedNotification(subNotification: SubNotification): NotificationTemplate {
        val context = Context().applyContext(subNotification)
        return NotificationTemplate(
            title = (subNotification.method.titleTemplate ?: subNotification.method.data._type.titleTemplate).render(
                context,
            ),
            body = (subNotification.method.bodyTemplate ?: subNotification.method.data._type.bodyTemplate).render(
                context,
            ),
        )
    }

    private fun String.render(context: Context): String = templateEngine
        .process(replaceCustomVariablesWithThymeleafVariables(context), context)
        .replaceThymeleafReplacementSquareBrackets()

    private fun Context.applyContext(subNotification: SubNotification) = apply {
        setVariable("monitorName", subNotification.notification.checkResult.monitor.name)
        setVariable(
            "status",
            when (subNotification.notification.checkResult.status) {
                MonitorStatus.UP -> """✅ UP"""
                MonitorStatus.DOWN -> """🔴 DOWN"""
                else -> throw InvalidAttributesException(
                    "Check result status not allowed to be ${subNotification.notification.checkResult.status}",
                )
            },
        )
        setVariable("title", subNotification.title)
        setVariable(
            "checkStartedAt",
            subNotification.notification.checkResult.pickedUpAt
                ?.atZone(teamSettingService.getTimeZone(subNotification.method.team.id))
                ?.format(DateTimeUtils.dateTimeFormatter),
        )
        setVariable("pingMs", subNotification.notification.checkResult.pingMs)
        setVariable("message", subNotification.message)
        setVariable(
            "checkResultLink",
            "${hostService.urlHost}/m/${subNotification.notification.checkResult.monitor.id}/c/${
                subNotification.notification.checkResult.id}/logs",
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
