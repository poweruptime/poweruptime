package org.poweruptime.backend.features.team.model

import org.jetbrains.exposed.v1.core.Alias
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.Table
import org.poweruptime.backend.core.models.HasModifiers
import org.poweruptime.backend.core.models.createdAt
import org.poweruptime.backend.core.models.enumerationByCode
import org.poweruptime.backend.core.models.updatedAt
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.authentication.model.UserRecord
import org.poweruptime.backend.features.authentication.model.rowToUserRecord
import java.time.Instant

object TeamUser : Table("team_user"), HasModifiers {
    override val createdAt = createdAt()
    override val updatedAt = updatedAt()

    val role = enumerationByCode<TeamRole>("role")

    val teamId = ulong("team_id").references(Team.id).index()
    val userId = ulong("user_id").references(User.id).index()

    val inviterId = ulong("inviter_id").references(User.id).nullable()

    override val primaryKey: PrimaryKey = PrimaryKey(teamId, userId)

    init {
        index(true, userId, teamId)
    }
}

data class TeamUserRecord(
    val createdAt: Instant,
    val updatedAt: Instant,
    val teamId: ULong,
    val userId: ULong,
    val inviterId: ULong?,
    val role: TeamRole,
)

fun TeamUser.rowToTeamUserRecord(row: ResultRow): TeamUserRecord = TeamUserRecord(
    createdAt = row[createdAt],
    updatedAt = row[updatedAt],
    teamId = row[teamId],
    userId = row[userId],
    inviterId = row[inviterId],
    role = row[role],
)

data class TeamUserJoinUserAndInviterRecord(
    val user: UserRecord,
    val inviter: UserRecord?,
    val teamUser: TeamUserRecord,
)

@Suppress("SENSELESS_COMPARISON")
fun TeamUser.rowToTeamUserJoinUserAndInviterRecord(
    row: ResultRow,
    userAlias: Alias<User>,
    inviterAlias: Alias<User>,
): TeamUserJoinUserAndInviterRecord = TeamUserJoinUserAndInviterRecord(
    user = User.rowToUserRecord(row, userAlias),
    inviter = if (row[inviterAlias[User.id]] != null) User.rowToUserRecord(row, inviterAlias) else null,
    teamUser = rowToTeamUserRecord(row),
)
