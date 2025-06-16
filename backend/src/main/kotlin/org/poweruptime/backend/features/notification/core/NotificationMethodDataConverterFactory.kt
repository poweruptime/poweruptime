package org.poweruptime.backend.features.notification.core

import org.poweruptime.backend.features.notification.notificationMethods.apprise.AppriseNotificationMethodDataAppriseConverter
import org.poweruptime.backend.features.notification.notificationMethods.discord.DiscordNotificationMethodDataAppriseConverter
import org.poweruptime.backend.features.notification.notificationMethods.email.EmailNotificationMethodDataAppriseConverter
import org.poweruptime.backend.features.notification.notificationMethods.slack.SlackNotificationMethodDataAppriseConverter

class NotificationMethodDataConverterFactory {
    private val converters = listOf(
        AppriseNotificationMethodDataAppriseConverter(),
        DiscordNotificationMethodDataAppriseConverter(),
        EmailNotificationMethodDataAppriseConverter(),
        SlackNotificationMethodDataAppriseConverter(),
    ).associateBy { it.type }

    fun getConverter(notificationMethodType: NotificationMethodType): NotificationMethodDataAppriseConverter = converters[notificationMethodType]
        ?: throw IllegalArgumentException("Unknown notification method data: $notificationMethodType")
}
