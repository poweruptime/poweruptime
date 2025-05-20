package org.poweruptime.backend.features.notification

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
    @Value(Config.NOTIFICATION_TEMP_ENABLED) private val tempNotificationsEnabled: Boolean = false,
    @Value(Config.APPRISE_URL) private val appriseUrl: String,
    private val restTemplate: RestTemplate,
    private val notificationTemplateService: NotificationTemplateService,
    private val tempNotificationService: TempNotificationService,
) {
    private val notificationMethodDataConverterFactory = NotificationMethodDataConverterFactory()
    private val htmlConverterFactory = HtmlConverterFactory()

    fun send(subNotification: SubNotification): SubNotification {
        val notificationTemplate = notificationTemplateService.getRenderedNotification(subNotification)
        subNotification.title = notificationTemplate.title
        subNotification.message = notificationTemplate.body

        val notificationMethodDataAppriseConverter = notificationMethodDataConverterFactory.getConverter(
            subNotification,
        )

        val statelessNotificationRequest = getAppriseNotificationRequest(
            notificationMethodDataAppriseConverter.convert(subNotification.method.data),
            notificationTemplate,
            subNotification.method.data._type,
            subNotification.notification.checkResult.status,
        )

        if (tempNotificationsEnabled) {
            tempNotificationService.addNotification(
                TempNotification(
                    to = subNotification.method.data._type.name,
                    subject = notificationTemplate.title,
                    bodyHTML = notificationTemplate.body,
                    appriseDto = statelessNotificationRequest,
                ),
            )

            subNotification.sentAt = Instant.now()

            return subNotification
        }

        val result = sendToApprise(statelessNotificationRequest)

        if (result != null) {
            subNotification.error = result.abbreviate(Database.MAX_MESSAGE_LENGTH)
        } else {
            subNotification.sentAt = Instant.now()
        }

        return subNotification
    }

    private fun getAppriseNotificationRequest(
        notificationMethodDataAppriseDto: NotificationMethodDataAppriseDto,
        notificationTemplate: NotificationTemplate,
        notificationMethodType: NotificationMethodType,
        status: MonitorStatus
    ) = AppriseNotificationRequest(
        urls = listOf(
            "${notificationMethodDataAppriseDto.url}?footer=no&image=no&format=${
                when (notificationMethodType.bodyType) {
                    NotificationMethodTemplateType.PLAIN -> AppriseNotificationFormat.TEXT
                    NotificationMethodTemplateType.HTML -> AppriseNotificationFormat.HTML
                    NotificationMethodTemplateType.MARKDOWN,
                    NotificationMethodTemplateType.MRKDWN -> AppriseNotificationFormat.MARKDOWN
                }
            }${
                notificationMethodDataAppriseDto.extras
                    ?.map { (key, value) -> "$key=$value" }
                    ?.joinToString("&", "&")
                    ?: ""
            }",
        ),
        title = notificationTemplate.title.emptyToNull(),
        body = htmlConverterFactory.getConverter(notificationMethodType.bodyType).convert(notificationTemplate.body),
        type = when (status) {
            MonitorStatus.UP -> AppriseNotificationType.INFO
            MonitorStatus.DOWN -> AppriseNotificationType.FAILURE
            MonitorStatus.PENDING,
            MonitorStatus.MAINTENANCE,
            MonitorStatus.PAUSED -> throw IllegalArgumentException(
                "Status not allowed at this point: $status",
            )
        },
        format = when (notificationMethodType.bodyType) {
            NotificationMethodTemplateType.PLAIN -> AppriseNotificationFormat.TEXT
            NotificationMethodTemplateType.HTML -> AppriseNotificationFormat.HTML
            NotificationMethodTemplateType.MARKDOWN,
            NotificationMethodTemplateType.MRKDWN -> AppriseNotificationFormat.MARKDOWN
        },
    )

    private fun sendToApprise(statelessNotificationRequest: AppriseNotificationRequest) = try {
        restTemplate.exchange(
            "$appriseUrl/notify",
            HttpMethod.POST,
            HttpEntity(
                statelessNotificationRequest,
                HttpHeaders().apply {
                    add("Accept", "*/*")
                    add("Content-Type", "application/json")
                },
            ),
            String::class.java,
        )
        null
    } catch (e: Throwable) {
        e.message ?: "Unknown error"
    }
}
