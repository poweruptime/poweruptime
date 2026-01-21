package org.poweruptime.backend.features.team.dto

import org.poweruptime.backend.features.team.model.TeamJoinTokenJoinInviteeAndInviter
import org.poweruptime.backend.features.team.model.TeamRole
import org.poweruptime.backend.features.user.UserMinResponse
import java.time.Instant

data class TeamJoinTokenResponse(
    val inviteeEmail: String,
    val inviter: UserMinResponse,
    val role: TeamRole,
    val createdAt: Instant,
) {
    constructor(it: TeamJoinTokenJoinInviteeAndInviter) : this(
        it.invitee.email,
        UserMinResponse(it.inviter),
        it.teamJoinToken.role,
        it.teamJoinToken.createdAt,
    )
}
