package org.poweruptime.backend.features.notification.notificationMethods.discord

import org.poweruptime.backend.features.notification.core.NotificationMethodData
import org.poweruptime.backend.features.notification.core.NotificationMethodDataAppriseConverter
import org.poweruptime.backend.features.notification.core.NotificationMethodDataAppriseDto
import org.poweruptime.backend.features.notification.core.NotificationMethodDataType

class DiscordNotificationMethodDataAppriseConverter(
    override val type: NotificationMethodDataType = NotificationMethodDataType.DISCORD,
) : NotificationMethodDataAppriseConverter {
    override fun convert(
        notificationMethodData: NotificationMethodData,
    ): NotificationMethodDataAppriseDto {
        val data = notificationMethodData as DiscordNotificationMethodData

        return NotificationMethodDataAppriseDto(
            url = data.url,
            extras = data.displayName?.let { mapOf("botname" to it) },
        )
    }
}
