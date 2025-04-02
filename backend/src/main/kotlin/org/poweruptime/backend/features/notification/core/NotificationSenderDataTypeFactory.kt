package org.poweruptime.backend.features.notification.core

import org.poweruptime.backend.features.notification.notificationSenders.discord.DiscordNotificationSenderData
import org.poweruptime.backend.features.notification.notificationSenders.email.EmailNotificationSenderData
import org.poweruptime.backend.features.notification.notificationSenders.slack.SlackNotificationSenderData

class NotificationSenderDataTypeFactory {
    private val sendersData = mapOf(
        NotificationSenderTypes.DISCORD to DiscordNotificationSenderData::class.java,
        NotificationSenderTypes.EMAIL to EmailNotificationSenderData::class.java,
        NotificationSenderTypes.SLACK to SlackNotificationSenderData::class.java,
    )

    fun toClass(monitorType: String): Class<*> =
        sendersData[monitorType] ?: throw IllegalArgumentException("Unknown sender data: $monitorType")

    fun toStringRepresentation(klass: Class<*>?): String = klass?.let { k ->
        sendersData.entries.find { it.value == k }?.key
            ?: throw IllegalArgumentException("Unknown sender class: ${k.name}")
    } ?: throw IllegalArgumentException("Class cannot be null")
}
