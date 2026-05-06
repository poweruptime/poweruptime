package org.poweruptime.backend.features.maintenance.model

import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.ULongIdTable
import org.jetbrains.exposed.v1.javatime.timestamp
import org.poweruptime.backend.core.models.HasModifiers
import org.poweruptime.backend.core.models.HasName
import org.poweruptime.backend.core.models.HasPublicId
import org.poweruptime.backend.core.models.HasSoftDelete
import org.poweruptime.backend.core.models.createdAt
import org.poweruptime.backend.core.models.enumerationByCode
import org.poweruptime.backend.core.models.name
import org.poweruptime.backend.core.models.nanoId
import org.poweruptime.backend.core.models.softDelete
import org.poweruptime.backend.core.models.updatedAt
import org.poweruptime.backend.core.utils.NANO_ID_SMALL_LENGTH
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.rowToMonitorRecord
import org.poweruptime.backend.features.team.model.Team
import java.time.Instant

object Maintenance : ULongIdTable("maintenance"), HasPublicId, HasModifiers, HasSoftDelete, HasName {
    override val publicId = nanoId("public_id", NANO_ID_SMALL_LENGTH)
    override val createdAt = createdAt()
    override val updatedAt = updatedAt()
    override val deleted = softDelete()
    override val name = name("title")

    val teamId = ulong("team_id").references(Team.id).index()
    val description = text("description").nullable()
    val startsAt = timestamp("starts_at").index()
    val endsAt = timestamp("ends_at").index()
    val timeZone = varchar("time_zone", 64)
    val visibility = enumerationByCode<MaintenanceVisibility>("visibility")
    val alertBehavior = enumerationByCode<MaintenanceAlertBehavior>("alert_behavior")
    val notifyScheduled = bool("notify_scheduled")
    val notifyStarted = bool("notify_started")
    val notifyEnded = bool("notify_ended")
    val reminderOffsetsMinutes = array<Int>("reminder_offsets_minutes")
    val reminderSentOffsetsMinutes = array<Int>("reminder_sent_offsets_minutes")
    val startedAt = timestamp("started_at").nullable()
    val endedAt = timestamp("ended_at").nullable()
    val scheduledNotifiedAt = timestamp("scheduled_notified_at").nullable()
    val startedNotifiedAt = timestamp("started_notified_at").nullable()
    val endedNotifiedAt = timestamp("ended_notified_at").nullable()
}

object MaintenanceMonitor : ULongIdTable("maintenance_monitor") {
    val maintenanceId = ulong("maintenance_id").references(Maintenance.id).index()
    val monitorId = ulong("monitor_id").references(Monitor.id).index()
}

data class MaintenanceRecord(
    val id: ULong,
    val publicId: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    val deleted: Instant?,
    val title: String,
    val teamId: ULong,
    val description: String?,
    val startsAt: Instant,
    val endsAt: Instant,
    val timeZone: String,
    val visibility: MaintenanceVisibility,
    val alertBehavior: MaintenanceAlertBehavior,
    val notifyScheduled: Boolean,
    val notifyStarted: Boolean,
    val notifyEnded: Boolean,
    val reminderOffsetsMinutes: List<Int>,
    val reminderSentOffsetsMinutes: List<Int>,
    val startedAt: Instant?,
    val endedAt: Instant?,
    val scheduledNotifiedAt: Instant?,
    val startedNotifiedAt: Instant?,
    val endedNotifiedAt: Instant?,
)

data class MaintenanceJoinMonitorRecord(val maintenance: MaintenanceRecord, val monitor: MonitorRecord)

fun Maintenance.rowToMaintenanceRecord(row: ResultRow): MaintenanceRecord = MaintenanceRecord(
    id = row[id].value,
    publicId = row[publicId],
    createdAt = row[createdAt],
    updatedAt = row[updatedAt],
    deleted = row[deleted],
    title = row[name],
    teamId = row[teamId],
    description = row[description],
    startsAt = row[startsAt],
    endsAt = row[endsAt],
    timeZone = row[timeZone],
    visibility = row[visibility],
    alertBehavior = row[alertBehavior],
    notifyScheduled = row[notifyScheduled],
    notifyStarted = row[notifyStarted],
    notifyEnded = row[notifyEnded],
    reminderOffsetsMinutes = row[reminderOffsetsMinutes].toList(),
    reminderSentOffsetsMinutes = row[reminderSentOffsetsMinutes].toList(),
    startedAt = row[startedAt],
    endedAt = row[endedAt],
    scheduledNotifiedAt = row[scheduledNotifiedAt],
    startedNotifiedAt = row[startedNotifiedAt],
    endedNotifiedAt = row[endedNotifiedAt],
)

fun rowToMaintenanceJoinMonitorRecord(row: ResultRow): MaintenanceJoinMonitorRecord = MaintenanceJoinMonitorRecord(
    maintenance = Maintenance.rowToMaintenanceRecord(row),
    monitor = Monitor.rowToMonitorRecord(row),
)
