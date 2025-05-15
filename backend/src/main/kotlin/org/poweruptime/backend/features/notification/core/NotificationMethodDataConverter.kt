package org.poweruptime.backend.features.notification.core

import org.poweruptime.backend.features.notification.model.SubNotification
import org.poweruptime.backend.features.notification.notificationMethods.discord.DiscordNotificationMethodDataAppriseConverter
import org.poweruptime.backend.features.notification.notificationMethods.email.EmailNotificationMethodDataAppriseConverter
import org.poweruptime.backend.features.notification.notificationMethods.slack.SlackNotificationMethodDataAppriseConverter
import org.springframework.stereotype.Service

@Service
class NotificationMethodDataConverter {
    private val converters = listOf(
        DiscordNotificationMethodDataAppriseConverter(),
        EmailNotificationMethodDataAppriseConverter(),
        SlackNotificationMethodDataAppriseConverter(),
    ).associateBy { it.type }

    fun converter(subNotification: SubNotification): NotificationMethodDataAppriseConverter = converters[subNotification.method.data._type]
        ?: throw IllegalArgumentException("Unknown notification sender: ${subNotification.method.data._type}")
}
