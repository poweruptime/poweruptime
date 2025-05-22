package org.poweruptime.backend.features.notification.notificationMethods.apprise

import org.poweruptime.backend.features.notification.core.NotificationMethodDataAppriseConverter
import org.poweruptime.backend.features.notification.core.NotificationMethodDataAppriseDto
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.model.NotificationMethodData

class AppriseNotificationMethodDataAppriseConverter(
    override val type: NotificationMethodType = NotificationMethodType.APPRISE,
) : NotificationMethodDataAppriseConverter {
    override fun convert(
        notificationMethodData: NotificationMethodData,
    ): NotificationMethodDataAppriseDto {
        val data = notificationMethodData as AppriseNotificationMethodData

        val urlParts = data.url.split("?")
        val queryExtras = urlParts.last().split("&")

        return NotificationMethodDataAppriseDto(
            url = urlParts.first(),
            extras = queryExtras.associate {
                val queryParam = it.split("=")

                queryParam.first() to queryParam.last()
            },
        )
    }
}
