package org.poweruptime.backend.features.notification.notificationMethods.slack

import org.poweruptime.backend.features.notification.core.NotificationMethodDataAppriseConverter
import org.poweruptime.backend.features.notification.core.NotificationMethodDataAppriseDto
import org.poweruptime.backend.features.notification.core.NotificationMethodDataType
import org.poweruptime.backend.features.notification.model.NotificationMethodData

class SlackNotificationMethodDataAppriseConverter(
    override val type: NotificationMethodDataType = NotificationMethodDataType.SLACK,
) : NotificationMethodDataAppriseConverter {
    override fun convert(
        notificationMethodData: NotificationMethodData,
    ): NotificationMethodDataAppriseDto {
        val data = notificationMethodData as SlackNotificationMethodData

        return NotificationMethodDataAppriseDto(
            data.url,
            extras = data.displayName?.let {
                mapOf("botname" to it)
            },
        )
    }
}
