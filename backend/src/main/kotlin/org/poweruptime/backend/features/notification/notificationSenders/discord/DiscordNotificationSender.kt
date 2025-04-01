package org.poweruptime.backend.features.notification.notificationSenders.discord

import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.notification.core.NotificationSender
import org.poweruptime.backend.features.notification.core.NotificationSenderType
import org.poweruptime.backend.features.notification.dto.NotificationTemplate
import org.poweruptime.backend.features.notification.model.Notification
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.web.client.RestTemplate

class DiscordNotificationSender(
    private val restTemplate: RestTemplate,
    override val type: NotificationSenderType = NotificationSenderType.DISCORD,
) : NotificationSender {
    data class DiscordEmbedDto(
        val title: String? = null,
        val description: String? = null,
        val color: Int? = null,
    )

    data class DiscordWebhookDto(
        val content: String? = null,
        val username: String? = null,
        val embeds: List<DiscordEmbedDto>? = null
    )

    override fun send(
        notification: Notification,
        notificationTemplate: NotificationTemplate,
    ): String? = try {
        val discordNotificationSenderData = notification.method.sender as DiscordNotificationSenderData

        restTemplate.exchange(
            discordNotificationSenderData.url,
            HttpMethod.POST,
            HttpEntity(
                DiscordWebhookDto(
                    username = discordNotificationSenderData.displayName,
                    embeds = listOf(
                        DiscordEmbedDto(
                            description = notificationTemplate.body,
                            color = Integer.parseInt(
                                when (notification.checkResult.status) {
                                    MonitorStatus.UP -> "22C45D"
                                    MonitorStatus.DOWN -> "EE4343"
                                    else -> "3A81F5"
                                },
                                16,
                            ),
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
