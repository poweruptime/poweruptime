package org.poweruptime.backend.features.notification.core

import org.poweruptime.backend.features.notification.model.SubNotification
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

    fun getConverter(subNotification: SubNotification): NotificationMethodDataAppriseConverter = converters[subNotification.method.data._type]
        ?: throw IllegalArgumentException("Unknown notification method data: ${subNotification.method.data._type}")
}
