package org.poweruptime.backend.features.notification.notificationMethods.slack

import org.poweruptime.backend.features.notification.core.NotificationMethodDataAppriseConverter
import org.poweruptime.backend.features.notification.core.NotificationMethodDataAppriseDto
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.model.NotificationMethodData

class SlackNotificationMethodDataAppriseConverter :
    NotificationMethodDataAppriseConverter(NotificationMethodType.SLACK) {
    override fun convert(notificationMethodData: NotificationMethodData): NotificationMethodDataAppriseDto {
        val data = notificationMethodData as SlackNotificationMethodDataRecord

        return NotificationMethodDataAppriseDto(
            data.url,
            extras = buildMap {
                set("blocks", "yes")
                data.displayName?.let {
                    set("botname", it)
                }
            },
        )
    }
}
