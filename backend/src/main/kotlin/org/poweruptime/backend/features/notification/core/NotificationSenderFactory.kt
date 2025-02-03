package org.poweruptime.backend.features.notification.core

import org.poweruptime.backend.core.utils.Config
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.abbreviate
import org.poweruptime.backend.features.mail.service.EmailTemplateService
import org.poweruptime.backend.features.notification.model.Notification
import org.poweruptime.backend.features.notification.notificationSenders.discord.DiscordNotificationSender
import org.poweruptime.backend.features.notification.notificationSenders.email.EmailNotificationSender
import org.poweruptime.backend.features.notification.service.NotificationTemplateService
import org.poweruptime.backend.features.tempNotification.TempNotification
import org.poweruptime.backend.features.tempNotification.TempNotificationService
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate
import java.time.Instant

@Service
class NotificationSenderFactory(
    @Value(Config.NOTIFICATION_TEMP_ENABLED) private val tempNotificationsEnabled: Boolean = false,
    private val tempNotificationService: TempNotificationService,
    private val notificationTemplateService: NotificationTemplateService,
    emailTemplateService: EmailTemplateService,
    restTemplate: RestTemplate
) {
    private val senders = listOf(
        DiscordNotificationSender(restTemplate),
        EmailNotificationSender(emailTemplateService),
    ).associateBy { it.type }

    fun send(notification: Notification): Notification {
        val notificationTemplate = notificationTemplateService.getRenderedNotification(notification)
        notification.title = notificationTemplate.title
        notification.message = notificationTemplate.body

        if (tempNotificationsEnabled) {
            tempNotificationService.addNotification(
                TempNotification(
                    to = notification.method.sender._type.name,
                    subject = notification.title,
                    body = "",
                    bodyHTML = notificationTemplate.body,
                ),
            )

            notification.sentAt = Instant.now()

            return notification
        }

        val checker = senders[notification.method.sender._type]
            ?: throw IllegalArgumentException("Unknown notification sender: ${notification.method.sender._type}")

        val result = checker.send(notification.method, notificationTemplate)

        if (result != null) {
            notification.error = result.abbreviate(Database.MAX_MESSAGE_LENGTH)
        } else {
            notification.sentAt = Instant.now()
        }

        return notification
    }
}
