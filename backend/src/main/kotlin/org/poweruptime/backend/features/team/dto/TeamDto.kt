package org.poweruptime.backend.features.team.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.monitor.dto.MonitorDashboardResponse
import org.poweruptime.backend.features.team.model.TeamRecord
import org.poweruptime.backend.features.team.model.TeamRole
import java.time.Instant

data class TeamMinResponse(val id: String, val name: String) {
    constructor(team: TeamRecord) : this(
        id = team.publicId,
        name = team.name,
    )
}

data class TeamResponse(
    val id: String,
    val name: String,
    val deleted: Instant?,
    val personal: Boolean,
    val yourPersonal: Boolean,
    val dashboard: MonitorDashboardResponse,
) {
    constructor(team: TeamRecord, yourPersonal: Boolean, dashboard: MonitorDashboardResponse) : this(
        id = team.publicId,
        name = team.name,
        deleted = team.deleted,
        personal = team.personalUserId != null,
        yourPersonal = yourPersonal,
        dashboard,
    )
}

data class TeamMaxResponse(
    val id: String,
    val name: String,
    val deleted: Instant?,
    val personal: Boolean,
    val yourPersonal: Boolean,
    val dashboard: MonitorDashboardResponse,
    val role: TeamRole,
) {
    constructor(team: TeamRecord, yourPersonal: Boolean, dashboard: MonitorDashboardResponse, role: TeamRole) : this(
        id = team.publicId,
        name = team.name,
        deleted = team.deleted,
        personal = team.personalUserId != null,
        yourPersonal = yourPersonal,
        dashboard,
        role,
    )
}

data class CreateTeamDto(
    @get:NotBlank @get:Size(min = Database.MIN_NAME_LENGTH, max = Database.MAX_NAME_LENGTH) val name: String,
)

data class UpdateTeamDto(
    @get:NotNull val id: String,
    @get:NotBlank @get:Size(min = Database.MIN_NAME_LENGTH, max = Database.MAX_NAME_LENGTH) val name: String,
)
