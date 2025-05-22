package org.poweruptime.backend.features.notification.core

import org.poweruptime.backend.features.notification.notificationMethods.apprise.AppriseNotificationMethodData
import org.poweruptime.backend.features.notification.notificationMethods.discord.DiscordNotificationMethodData
import org.poweruptime.backend.features.notification.notificationMethods.email.EmailNotificationMethodData
import org.poweruptime.backend.features.notification.notificationMethods.slack.SlackNotificationMethodData

class NotificationMethodDataTypeFactory {
    private val dataTypes = mapOf(
        NotificationMethodTypes.APPRISE to AppriseNotificationMethodData::class.java,
        NotificationMethodTypes.DISCORD to DiscordNotificationMethodData::class.java,
        NotificationMethodTypes.EMAIL to EmailNotificationMethodData::class.java,
        NotificationMethodTypes.SLACK to SlackNotificationMethodData::class.java,
    )

    fun toClass(monitorType: String): Class<*> =
        dataTypes[monitorType] ?: throw IllegalArgumentException("Unknown method data: $monitorType")

    fun toStringRepresentation(klass: Class<*>?): String = klass?.let { k ->
        dataTypes.entries.find { it.value == k }?.key
            ?: throw IllegalArgumentException("Unknown method data class: ${k.name}")
    } ?: throw IllegalArgumentException("Class cannot be null")
}
