package org.poweruptime.backend.features.team.model

import org.jetbrains.exposed.v1.core.ResultRow
import org.poweruptime.backend.core.models.HasModifiers
import org.poweruptime.backend.core.models.NanoIdTable
import org.poweruptime.backend.core.models.createdAt
import org.poweruptime.backend.core.models.enumerationByCode
import org.poweruptime.backend.core.models.updatedAt
import org.poweruptime.backend.core.utils.NANO_ID_MAX_LENGTH
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.authentication.model.UserRecord
import java.time.Instant

object TeamJoinToken : NanoIdTable("team_join_token", NANO_ID_MAX_LENGTH), HasModifiers {
    override val createdAt = createdAt()
    override val updatedAt = updatedAt()

    val inviteeId = ulong("invitee_id").references(User.id).index()
    val inviterId = ulong("inviter_id").references(User.id).index()
    val teamId = ulong("team_id").references(Team.id).index()

    val role = enumerationByCode<TeamRole>("role")
    val valid = bool("valid").clientDefault { true }
}

data class TeamJoinTokenRecord(
    val id: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    val inviteeId: ULong,
    val inviterId: ULong,
    val teamId: ULong,
    val role: TeamRole,
    val valid: Boolean,
)

fun TeamJoinToken.rowToTeamJoinTokenRecord(row: ResultRow): TeamJoinTokenRecord = TeamJoinTokenRecord(
    id = row[id].value,
    createdAt = row[createdAt],
    updatedAt = row[updatedAt],
    inviteeId = row[inviteeId],
    inviterId = row[inviterId],
    teamId = row[teamId],
    role = row[role],
    valid = row[valid],
)

data class TeamJoinTokenJoinInviteeAndInviter(
    val teamJoinToken: TeamJoinTokenRecord,
    val invitee: UserRecord,
    val inviter: UserRecord,
)
