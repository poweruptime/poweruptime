package org.poweruptime.backend.features.notification.dto

import org.poweruptime.backend.features.monitor.dto.CheckResultMinResponse
import org.poweruptime.backend.features.monitor.dto.MonitorMinResponse
import org.poweruptime.backend.features.notification.model.Notification
import org.poweruptime.backend.features.notification.model.SubNotification
import java.time.Instant

data class NotificationTemplate(val title: String, val body: String)

data class NotificationMinResponse(
    val id: String,
) {
    constructor(it: Notification) : this(it.id)
}

data class NotificationResponse(
    val id: String,
    val checkResult: CheckResultMinResponse,
    val title: String,
    val createdAt: Instant,
    val monitor: MonitorMinResponse
) {
    constructor(it: Notification) : this(
        id = it.id,
        checkResult = CheckResultMinResponse(it.checkResult),
        title = it.title,
        createdAt = it.createdAt,
        monitor = MonitorMinResponse(it.checkResult.monitor),
    )
}

data class SubNotificationResponse(
    val id: String,
    val title: String,
    val message: String?,
    val method: NotificationMethodMinResponse,
    val sentAt: Instant?,
    val error: String?,
    val notification: NotificationMinResponse,
) {
    constructor(it: SubNotification) : this(
        id = it.id,
        title = it.title,
        message = it.message,
        method = NotificationMethodMinResponse(it.method),
        sentAt = it.sentAt,
        error = it.error,
        notification = NotificationMinResponse(it.notification),
    )
}
