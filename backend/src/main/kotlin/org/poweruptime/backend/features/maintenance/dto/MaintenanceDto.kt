package org.poweruptime.backend.features.maintenance.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.maintenance.model.MaintenanceAlertBehavior
import org.poweruptime.backend.features.maintenance.model.MaintenanceRecord
import org.poweruptime.backend.features.maintenance.model.MaintenanceVisibility
import org.poweruptime.backend.features.monitor.dto.MonitorMinResponse
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import java.time.Instant

data class MaintenanceResponse(
    val id: String,
    val title: String,
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
    val startedAt: Instant?,
    val endedAt: Instant?,
    val deleted: Instant?,
    val monitors: List<MonitorMinResponse>,
) {
    constructor(maintenance: MaintenanceRecord, monitors: List<MonitorRecord>) : this(
        id = maintenance.publicId,
        title = maintenance.title,
        description = maintenance.description,
        startsAt = maintenance.startsAt,
        endsAt = maintenance.endsAt,
        timeZone = maintenance.timeZone,
        visibility = maintenance.visibility,
        alertBehavior = maintenance.alertBehavior,
        notifyScheduled = maintenance.notifyScheduled,
        notifyStarted = maintenance.notifyStarted,
        notifyEnded = maintenance.notifyEnded,
        reminderOffsetsMinutes = maintenance.reminderOffsetsMinutes,
        startedAt = maintenance.startedAt,
        endedAt = maintenance.endedAt,
        deleted = maintenance.deleted,
        monitors = monitors.map { MonitorMinResponse(it) },
    )
}

data class PublicMaintenanceResponse(
    val id: String,
    val title: String,
    val description: String?,
    val startsAt: Instant,
    val endsAt: Instant,
    val timeZone: String,
    val monitors: List<MonitorMinResponse>,
) {
    constructor(maintenance: MaintenanceRecord, monitors: List<MonitorRecord>) : this(
        id = maintenance.publicId,
        title = maintenance.title,
        description = maintenance.description,
        startsAt = maintenance.startsAt,
        endsAt = maintenance.endsAt,
        timeZone = maintenance.timeZone,
        monitors = monitors.map { MonitorMinResponse(it) },
    )
}

data class CreateMaintenanceDto(
    @get:NotNull val teamId: String,
    @get:NotBlank @get:Size(min = Database.MIN_NAME_LENGTH, max = Database.MAX_NAME_LENGTH) val title: String,
    val description: String?,
    val startsAt: Instant?,
    @get:NotNull val endsAt: Instant,
    @get:NotBlank val timeZone: String,
    @get:NotNull val visibility: MaintenanceVisibility,
    @get:NotNull val alertBehavior: MaintenanceAlertBehavior,
    @get:NotNull val monitorIds: List<String>,
    val startNow: Boolean = false,
    val notifyScheduled: Boolean = false,
    val notifyStarted: Boolean = true,
    val notifyEnded: Boolean = true,
    val reminderOffsetsMinutes: List<Int> = listOf(15),
)

data class UpdateMaintenanceDto(
    @get:NotNull val id: String,
    @get:NotBlank @get:Size(min = Database.MIN_NAME_LENGTH, max = Database.MAX_NAME_LENGTH) val title: String,
    val description: String?,
    @get:NotNull val startsAt: Instant,
    @get:NotNull val endsAt: Instant,
    @get:NotBlank val timeZone: String,
    @get:NotNull val visibility: MaintenanceVisibility,
    @get:NotNull val alertBehavior: MaintenanceAlertBehavior,
    @get:NotNull val monitorIds: List<String>,
    val notifyScheduled: Boolean = false,
    val notifyStarted: Boolean = true,
    val notifyEnded: Boolean = true,
    val reminderOffsetsMinutes: List<Int> = listOf(15),
)
