package org.poweruptime.backend.features.team.model

import org.jetbrains.exposed.v1.core.Alias
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.Table
import org.poweruptime.backend.core.models.HasModifiers
import org.poweruptime.backend.core.models.createdAt
import org.poweruptime.backend.core.models.enumerationByCode
import org.poweruptime.backend.core.models.updatedAt
import org.poweruptime.backend.features.authentication.model.UserRecord
import org.poweruptime.backend.features.authentication.model.UserTable
import org.poweruptime.backend.features.authentication.model.rowToUserRecord
import java.time.Instant

object TeamUserTable : Table("team_user"), HasModifiers {
    override val createdAt = createdAt()
    override val updatedAt = updatedAt()

    val role = enumerationByCode<TeamRole>("role")

    val teamId = ulong("team_id").references(TeamTable.id).index()
    val userId = ulong("user_id").references(UserTable.id).index()

    val inviterId = ulong("inviter_id").references(UserTable.id).nullable()

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
    val role: TeamRole
)

fun TeamUserTable.rowToTeamUserRecord(row: ResultRow): TeamUserRecord =
    TeamUserRecord(
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
    val teamUser: TeamUserRecord
)

fun TeamUserTable.rowToTeamUserJoinUserAndInviterRecord(
    row: ResultRow,
    userAlias: Alias<UserTable>,
    inviterAlias: Alias<UserTable>
): TeamUserJoinUserAndInviterRecord =
    TeamUserJoinUserAndInviterRecord(
        user = UserTable.rowToUserRecord(row, userAlias),
        inviter = if (row[inviterAlias[UserTable.id]] != null) UserTable.rowToUserRecord(row, inviterAlias) else null,
        teamUser = TeamUserTable.rowToTeamUserRecord(row),
    )
