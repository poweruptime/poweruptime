package org.poweruptime.backend.features.notification.dto

import org.poweruptime.backend.features.monitor.dto.CheckResultMinResponse
import org.poweruptime.backend.features.monitor.dto.MonitorMinResponse
import org.poweruptime.backend.features.notification.model.Notification
import java.time.Instant

data class NotificationTemplate(val title: String, val body: String)

data class NotificationResponse(
    val id: String,
    val checkResult: CheckResultMinResponse,
    val title: String,
    val message: String?,
    val method: NotificationMethodMinResponse,
    val createdAt: Instant,
    val sentAt: Instant?,
    val error: String?,
    val monitor: MonitorMinResponse
) {
    constructor(it: Notification) : this(
        id = it.id,
        checkResult = CheckResultMinResponse(it.checkResult),
        title = it.title,
        message = it.message,
        method = NotificationMethodMinResponse(it.method),
        createdAt = it.createdAt,
        sentAt = it.sentAt,
        error = it.error,
        monitor = MonitorMinResponse(it.checkResult.monitor),
    )
}
