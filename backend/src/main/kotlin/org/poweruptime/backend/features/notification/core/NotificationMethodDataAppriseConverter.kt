package org.poweruptime.backend.features.notification.core

import org.poweruptime.backend.features.notification.model.NotificationMethodData

interface NotificationMethodDataAppriseConverter {
    val type: NotificationMethodType

    fun convert(notificationMethodData: NotificationMethodData): NotificationMethodDataAppriseDto
}
