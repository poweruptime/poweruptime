package org.poweruptime.backend.features.notification

import io.github.oshai.kotlinlogging.KotlinLogging
import org.poweruptime.backend.core.utils.Config
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.abbreviate
import org.poweruptime.backend.core.utils.emptyToNull
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.notification.core.AppriseNotificationFormat
import org.poweruptime.backend.features.notification.core.AppriseNotificationRequest
import org.poweruptime.backend.features.notification.core.AppriseNotificationType
import org.poweruptime.backend.features.notification.core.NotificationMethodDataAppriseDto
import org.poweruptime.backend.features.notification.core.NotificationMethodDataConverterFactory
import org.poweruptime.backend.features.notification.core.NotificationMethodTemplateType
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.dto.NotificationTemplate
import org.poweruptime.backend.features.notification.htmlConverter.HtmlConverterFactory
import org.poweruptime.backend.features.notification.model.SubNotification
import org.poweruptime.backend.features.notification.service.NotificationTemplateService
import org.poweruptime.backend.features.tempNotification.TempNotification
import org.poweruptime.backend.features.tempNotification.TempNotificationService
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate
import java.time.Instant

@Service
class AppriseSender(
    @Value(Config.NOTIFICATION_TEMP_ENABLED)
    private val tempNotificationsEnabled: Boolean = false,

    @Value(Config.APPRISE_URL)
    private val appriseUrl: String,

    private val restTemplate: RestTemplate,
    private val notificationTemplateService: NotificationTemplateService,
    private val tempNotificationService: TempNotificationService,
) {
    private final val logger = KotlinLogging.logger {}
    private final val notificationMethodDataConverterFactory = NotificationMethodDataConverterFactory()
    private final val htmlConverterFactory = HtmlConverterFactory()

    fun send(subNotification: SubNotification): SubNotification {
        logger.info {
            "Starting send() for SubNotification(id=${subNotification.id}, type=${subNotification.method.data._type})"
        }

        val notificationTemplate =
            notificationTemplateService.getRenderedNotification(subNotification)
        logger.debug {
            "Rendered template: title='${notificationTemplate.title}', " +
                "body='${notificationTemplate.body.take(100)}...'"
        }

        subNotification.title = notificationTemplate.title
        subNotification.message = notificationTemplate.body

        val converter =
            notificationMethodDataConverterFactory.getConverter(subNotification)
        val appriseDto = converter.convert(subNotification.method.data)

        val request = getAppriseNotificationRequest(
            appriseDto,
            notificationTemplate,
            subNotification.method.data._type,
            subNotification.notification.checkResult.status,
        )
        logger.debug {
            "Built AppriseNotificationRequest: $request"
        }

        if (tempNotificationsEnabled) {
            logger.info { "Temp notifications enabled, storing temp notification" }
            tempNotificationService.addNotification(
                TempNotification(
                    to = subNotification.method.data._type.name,
                    subject = notificationTemplate.title,
                    bodyHTML = notificationTemplate.body,
                    appriseDto = request,
                ),
            )
            subNotification.sentAt = Instant.now()
            logger.info { "Temp notification saved, returning without calling Apprise" }
            return subNotification
        }

        val errorMessage = sendToApprise(request)
        if (errorMessage != null) {
            logger.error { "Error sending to Apprise: $errorMessage" }
            subNotification.error = errorMessage.abbreviate(Database.MAX_MESSAGE_LENGTH)
        } else {
            subNotification.sentAt = Instant.now()
            logger.info { "Notification sent successfully at ${subNotification.sentAt}" }
        }

        return subNotification
    }

    private fun getAppriseNotificationRequest(
        dto: NotificationMethodDataAppriseDto,
        tpl: NotificationTemplate,
        type: NotificationMethodType,
        status: MonitorStatus
    ) = AppriseNotificationRequest(
        urls = listOf(
            buildString {
                append(dto.url)
                append("?footer=no&image=no&format=")
                append(
                    when (type.bodyType) {
                        NotificationMethodTemplateType.PLAIN -> AppriseNotificationFormat.TEXT
                        NotificationMethodTemplateType.HTML -> AppriseNotificationFormat.HTML
                        NotificationMethodTemplateType.MARKDOWN,
                        NotificationMethodTemplateType.MRKDWN -> AppriseNotificationFormat.MARKDOWN
                    },
                )
                dto.extras
                    ?.map { (k, v) -> "$k=$v" }
                    ?.joinToString("&", "&")
                    ?.let { append(it) }
            },
        ),
        title = tpl.title.emptyToNull(),
        body = htmlConverterFactory
            .getConverter(type.bodyType)
            .convert(tpl.body),
        type = when (status) {
            MonitorStatus.UP -> AppriseNotificationType.INFO
            MonitorStatus.DOWN -> AppriseNotificationType.FAILURE
            else -> throw IllegalArgumentException(
                "Status not allowed at this point: $status",
            )
        },
        format = when (type.bodyType) {
            NotificationMethodTemplateType.PLAIN -> AppriseNotificationFormat.TEXT
            NotificationMethodTemplateType.HTML -> AppriseNotificationFormat.HTML
            NotificationMethodTemplateType.MARKDOWN,
            NotificationMethodTemplateType.MRKDWN -> AppriseNotificationFormat.MARKDOWN
        },
    )

    private fun sendToApprise(
        request: AppriseNotificationRequest
    ): String? = try {
        logger.info { "Posting to Apprise URL: '$appriseUrl/notify' " }
        restTemplate.exchange(
            "$appriseUrl/notify",
            HttpMethod.POST,
            HttpEntity(
                request,
                HttpHeaders().apply {
                    add("Accept", "*/*")
                    add("Content-Type", "application/json")
                },
            ),
            String::class.java,
        )
        null
    } catch (e: Throwable) {
        logger.error { "Exception while calling Apprise, $e" }
        e.message ?: "Unknown error"
    }
}
