package org.poweruptime.backend.features.notification.core

import org.poweruptime.backend.features.notification.notificationMethods.discord.DiscordNotificationMethodData
import org.poweruptime.backend.features.notification.notificationMethods.email.EmailNotificationMethodData
import org.poweruptime.backend.features.notification.notificationMethods.slack.SlackNotificationMethodData

class NotificationMethodDataTypeFactory {
    private val sendersData = mapOf(
        NotificationMethodDataTypes.DISCORD to DiscordNotificationMethodData::class.java,
        NotificationMethodDataTypes.EMAIL to EmailNotificationMethodData::class.java,
        NotificationMethodDataTypes.SLACK to SlackNotificationMethodData::class.java,
    )

    fun toClass(monitorType: String): Class<*> =
        sendersData[monitorType] ?: throw IllegalArgumentException("Unknown method data: $monitorType")

    fun toStringRepresentation(klass: Class<*>?): String = klass?.let { k ->
        sendersData.entries.find { it.value == k }?.key
            ?: throw IllegalArgumentException("Unknown method data class: ${k.name}")
    } ?: throw IllegalArgumentException("Class cannot be null")
}
