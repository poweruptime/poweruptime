package org.poweruptime.backend.features.notification.core

interface NotificationMethodDataAppriseConverter {
    val type: NotificationMethodDataType

    fun convert(notificationMethodData: NotificationMethodData): NotificationMethodDataAppriseDto
}
