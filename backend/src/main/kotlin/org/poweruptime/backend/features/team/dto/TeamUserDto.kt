package org.poweruptime.backend.features.team.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import org.poweruptime.backend.features.team.model.TeamRole
import org.poweruptime.backend.features.team.model.TeamUserJoinUserAndInviterRecord
import org.poweruptime.backend.features.user.UserMinResponse
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
    constructor(teamUser: TeamUserJoinUserAndInviterRecord) : this(
        user = UserMinResponse(teamUser.user),
        role = teamUser.teamUser.role,
        invitedBy = teamUser.inviter?.let { UserMinResponse(it) },
        invitedAt = teamUser.teamUser.createdAt,
    )
}
