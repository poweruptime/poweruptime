package org.poweruptime.backend.features.notification.core

import org.poweruptime.backend.features.notification.dto.NotificationTemplate
import org.poweruptime.backend.features.notification.model.Notification

interface NotificationSender {
    val type: NotificationSenderType

    fun send(
        notification: Notification,
        notificationTemplate: NotificationTemplate,
    ): String?
}
