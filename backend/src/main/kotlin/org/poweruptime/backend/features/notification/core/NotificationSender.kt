package org.poweruptime.backend.features.notification.core

import org.poweruptime.backend.features.notification.dto.NotificationTemplate
import org.poweruptime.backend.features.notification.model.NotificationMethod

interface NotificationSender {
    val type: NotificationSenderType

    fun send(notificationMethod: NotificationMethod, notificationTemplate: NotificationTemplate): String?
}
