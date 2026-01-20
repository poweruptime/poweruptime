package org.poweruptime.backend.features.notification.model

import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.Table
import org.poweruptime.backend.features.monitor.model.Monitor

object MonitorNotificationMethod : Table("monitor_notification_method") {
    val monitorId = ulong("monitor_id").references(Monitor.id).index()
    val notificationMethodId = ulong("notification_method_id").references(NotificationMethod.id).index()

    override val primaryKey: PrimaryKey = PrimaryKey(monitorId, notificationMethodId)
}

data class MonitorNotificationMethodRecord(val monitorId: ULong, val notificationMethodId: ULong)

fun MonitorNotificationMethod.rowToMonitorNotificationMethodRecord(row: ResultRow): MonitorNotificationMethodRecord =
    MonitorNotificationMethodRecord(
        monitorId = row[monitorId],
        notificationMethodId = row[notificationMethodId],
    )
