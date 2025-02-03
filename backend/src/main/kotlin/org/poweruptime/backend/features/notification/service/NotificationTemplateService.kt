package org.poweruptime.backend.features.notification.service

import org.poweruptime.backend.core.utils.DateTimeUtils
import org.poweruptime.backend.features.HostService
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.notification.dto.NotificationTemplate
import org.poweruptime.backend.features.notification.model.Notification
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.stereotype.Service
import org.thymeleaf.TemplateEngine
import org.thymeleaf.context.Context
import java.time.ZoneId
import javax.naming.directory.InvalidAttributesException

const val OPENING_SQUARE_BRACKET_REPLACEMENT_CHAR = "¼"
const val CLOSING_SQUARE_BRACKET_REPLACEMENT_CHAR = "½"

@Service
class NotificationTemplateService(
    @Qualifier("textTemplateEngine") private val templateEngine: TemplateEngine,
    private val hostService: HostService,
) {
    fun getRenderedNotification(notification: Notification): NotificationTemplate {
        val context = Context().applyContext(notification)
        return NotificationTemplate(
            title = (notification.method.titleTemplate ?: notification.method.sender._type.titleTemplate).render(
                context,
            ),
            body = (notification.method.bodyTemplate ?: notification.method.sender._type.bodyTemplate).render(
                context,
            ),
        )
    }

    private fun String.render(context: Context): String = templateEngine
        .process(replaceCustomVariablesWithThymeleafVariables(context), context)
        .replaceThymeleafReplacementSquareBrackets()

    private fun Context.applyContext(notification: Notification) = apply {
        setVariable("monitorName", notification.checkResult.monitor.name)
        setVariable(
            "status",
            when (notification.checkResult.status) {
                MonitorStatus.UP -> """✅UP"""
                MonitorStatus.DOWN -> """🔴DOWN"""
                else -> throw InvalidAttributesException(
                    "Check result status not allowed to be ${notification.checkResult.status}",
                )
            },
        )
        setVariable("title", notification.title)
        setVariable(
            "checkStartedAt",
            notification.checkResult.pickedUpAt
                ?.atZone(ZoneId.systemDefault())
                ?.format(DateTimeUtils.dateTimeFormatter),
        )
        setVariable("pingMs", notification.checkResult.pingMs)
        setVariable("message", notification.message)
        setVariable(
            "checkResultLink",
            "${hostService.urlHost}/m/${notification.checkResult.monitor.id}/c/${notification.checkResult.id}/logs",
        )
    }

    private fun String.replaceCustomVariablesWithThymeleafVariables(context: Context): String {
        var template = replaceNoneThymeleafSquareBrackets()

        context.variableNames.forEach {
            template = template.replace(":$it", "[[\${$it}]]")
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
