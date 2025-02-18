package org.poweruptime.backend.features.team.dto

import org.poweruptime.backend.features.team.model.TeamJoinToken
import org.poweruptime.backend.features.team.model.TeamRole
import org.poweruptime.backend.features.user.dto.UserMinResponse
import java.time.Instant

data class TeamJoinTokenResponse(
    val id: String,
    val inviteeEmail: String,
    val inviter: UserMinResponse,
    val role: TeamRole,
    val createdAt: Instant
) {
    constructor(it: TeamJoinToken) : this(it.id, it.invitee.email, UserMinResponse(it.inviter), it.role, it.createdAt)
}
