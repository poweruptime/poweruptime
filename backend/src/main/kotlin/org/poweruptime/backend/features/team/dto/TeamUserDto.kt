package org.poweruptime.backend.features.team.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import org.poweruptime.backend.features.team.model.TeamRole
import org.poweruptime.backend.features.team.model.TeamUser
import org.poweruptime.backend.features.user.dto.UserMinResponse
import java.time.Instant

data class InviteTeamUserDto(
    @get:NotNull val role: TeamRole,
    @get:NotBlank val email: String
)

data class UpdateTeamUserDto(
    @get:NotNull val userId: String,
    @get:NotNull val role: TeamRole,
)

data class TeamUserResponse(
    val user: UserMinResponse,
    val role: TeamRole,
    val invitedBy: UserMinResponse?,
    val invitedAt: Instant,
) {
    constructor(teamUser: TeamUser) : this(
        user = UserMinResponse(teamUser.id.user),
        role = teamUser.role,
        invitedBy = teamUser.invitedBy?.let { UserMinResponse(it) },
        invitedAt = teamUser.createdAt,
    )
}
