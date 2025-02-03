package org.poweruptime.backend.features.notification.notificationSenders.discord

import org.poweruptime.backend.features.notification.core.NotificationSender
import org.poweruptime.backend.features.notification.core.NotificationSenderType
import org.poweruptime.backend.features.notification.dto.NotificationTemplate
import org.poweruptime.backend.features.notification.model.NotificationMethod
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.web.client.RestTemplate

class DiscordNotificationSender(
    private val restTemplate: RestTemplate,
    override val type: NotificationSenderType = NotificationSenderType.DISCORD,
) : NotificationSender {
    data class DiscordWebhookDto(
        val content: String,
        val username: String,
    )

    override fun send(
        notificationMethod: NotificationMethod,
        notificationTemplate: NotificationTemplate
    ): String? = try {
        val discordNotificationSenderData = notificationMethod.sender as DiscordNotificationSenderData

        restTemplate.exchange(
            discordNotificationSenderData.url,
            HttpMethod.POST,
            HttpEntity(
                DiscordWebhookDto(
                    content = notificationTemplate.body,
                    username = discordNotificationSenderData.displayName ?: "poweruptime",
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
