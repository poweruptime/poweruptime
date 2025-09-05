package org.poweruptime.backend.features.notification.core

import org.poweruptime.backend.features.notification.notificationMethods.apprise.AppriseNotificationMethodDataRecord
import org.poweruptime.backend.features.notification.notificationMethods.discord.DiscordNotificationMethodDataRecord
import org.poweruptime.backend.features.notification.notificationMethods.email.EmailNotificationMethodDataRecord
import org.poweruptime.backend.features.notification.notificationMethods.slack.SlackNotificationMethodDataRecord

class NotificationMethodDataTypeFactory {
    private val dataTypes = mapOf(
        NotificationMethodTypes.APPRISE to AppriseNotificationMethodDataRecord::class.java,
        NotificationMethodTypes.DISCORD to DiscordNotificationMethodDataRecord::class.java,
        NotificationMethodTypes.EMAIL to EmailNotificationMethodDataRecord::class.java,
        NotificationMethodTypes.SLACK to SlackNotificationMethodDataRecord::class.java,
    )

    fun toClass(notificationMethodType: String): Class<*> =
        dataTypes[notificationMethodType]
            ?: throw IllegalArgumentException("Unknown method data: $notificationMethodType")

    fun toStringRepresentation(klass: Class<*>?): String = klass?.let { k ->
        dataTypes.entries.find { it.value == k }?.key
            ?: throw IllegalArgumentException("Unknown method data class: ${k.name}")
    } ?: throw IllegalArgumentException("Class cannot be null")
}
