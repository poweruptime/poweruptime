package org.poweruptime.backend.features.notification.notificationSenders.slack

import org.poweruptime.backend.features.notification.core.NotificationSender
import org.poweruptime.backend.features.notification.core.NotificationSenderType
import org.poweruptime.backend.features.notification.dto.NotificationTemplate
import org.poweruptime.backend.features.notification.model.Notification
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.web.client.RestTemplate

class SlackNotificationSender(
    private val restTemplate: RestTemplate,
    override val type: NotificationSenderType = NotificationSenderType.SLACK,
) : NotificationSender {
    @Suppress("ConstructorParameterNaming")
    data class SlackAttachmentDto(
        val color: String?,
        val author_name: String?,
        val text: String?,
        val mrkdwn_in: List<String> = listOf("text"),
    )
    data class SlackWebhookDto(
        val attachments: List<SlackAttachmentDto>?
    )

    override fun send(
        notification: Notification,
        notificationTemplate: NotificationTemplate,
    ): String? = try {
        val slackNotificationSenderData = notification.method.sender as SlackNotificationSenderData

        restTemplate.exchange(
            slackNotificationSenderData.url,
            HttpMethod.POST,
            HttpEntity(
                SlackWebhookDto(
                    attachments = listOf(
                        SlackAttachmentDto(
                            text = notificationTemplate.body,
                            color = notification.checkResult.status.color,
                            author_name = slackNotificationSenderData.displayName,
                        ),
                    ),
                ),
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
