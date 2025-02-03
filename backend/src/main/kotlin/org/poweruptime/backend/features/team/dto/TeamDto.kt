package org.poweruptime.backend.features.team.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.monitor.dto.MonitorDashboardResponse
import org.poweruptime.backend.features.team.model.Team
import java.time.Instant

data class MinTeamResponse(
    val id: String,
    val name: String,
) {
    constructor(team: Team) : this(
        id = team.id,
        name = team.name,
    )
}

data class TeamResponse(
    val id: String,
    val name: String,
    val deleted: Instant?,
    val personal: Boolean,
    val dashboard: MonitorDashboardResponse,
) {
    constructor(team: Team, personal: Boolean, dashboard: MonitorDashboardResponse) : this(
        team.id,
        team.name,
        team.deleted,
        personal,
        dashboard,
    )
}

data class CreateTeamDto(
    @get:NotBlank @get:Size(min = Database.MIN_NAME_LENGTH, max = Database.MAX_NAME_LENGTH) val name: String,
)

data class UpdateTeamDto(
    @get:NotNull val id: String,
    @get:NotBlank @get:Size(min = Database.MIN_NAME_LENGTH, max = Database.MAX_NAME_LENGTH) val name: String,
)
