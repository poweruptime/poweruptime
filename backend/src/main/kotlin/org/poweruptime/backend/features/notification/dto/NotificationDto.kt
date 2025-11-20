package org.poweruptime.backend.features.notification.dto

import org.poweruptime.backend.features.monitor.dto.CheckResultMinResponse
import org.poweruptime.backend.features.monitor.dto.MonitorMinResponse
import org.poweruptime.backend.features.notification.model.NotificationJoinCheckResultMonitorAndTeamRecord
import org.poweruptime.backend.features.notification.model.NotificationRecord
import org.poweruptime.backend.features.notification.model.SubNotificationJoinMethodAndNotificationRecord
import org.poweruptime.backend.features.team.dto.TeamMinResponse
import java.time.Instant

data class NotificationTemplate(val title: String, val body: String)

data class NotificationMinResponse(
    val id: String,
) {
    constructor(it: NotificationRecord) : this(it.publicId)
}

data class NotificationResponse(
    val id: String,
    val checkResult: CheckResultMinResponse,
    val title: String,
    val createdAt: Instant,
    val monitor: MonitorMinResponse,
    val team: TeamMinResponse,
) {
    constructor(it: NotificationJoinCheckResultMonitorAndTeamRecord) : this(
        id = it.notification.publicId,
        checkResult = CheckResultMinResponse(it.checkResult),
        title = it.notification.title,
        createdAt = it.notification.createdAt,
        monitor = MonitorMinResponse(it.monitor),
        team = TeamMinResponse(it.team),
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
    constructor(it: SubNotificationJoinMethodAndNotificationRecord) : this(
        id = it.subNotification.publicId,
        title = it.subNotification.title,
        message = it.subNotification.message,
        method = NotificationMethodMinResponse(it.method),
        sentAt = it.subNotification.sentAt,
        error = it.subNotification.error,
        notification = NotificationMinResponse(it.notification),
    )
}
