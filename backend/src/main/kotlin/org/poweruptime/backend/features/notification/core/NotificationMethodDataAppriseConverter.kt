package org.poweruptime.backend.features.notification.core

import org.poweruptime.backend.features.notification.model.NotificationMethodData

interface NotificationMethodDataAppriseConverter {
    val type: NotificationMethodDataType

    fun convert(notificationMethodData: NotificationMethodData): NotificationMethodDataAppriseDto
}
