package org.poweruptime.backend.features.team.domain

import org.jetbrains.exposed.v1.core.alias
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.core.leftJoin
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.core.domain.pageQuery
import org.poweruptime.backend.features.authentication.model.UserTable
import org.poweruptime.backend.features.team.model.TeamUserJoinUserAndInviterRecord
import org.poweruptime.backend.features.team.model.TeamUserRecord
import org.poweruptime.backend.features.team.model.TeamUserTable
import org.poweruptime.backend.features.team.model.rowToTeamUserJoinUserAndInviterRecord
import org.poweruptime.backend.features.team.model.rowToTeamUserRecord
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

fun TeamUserTable.findAll(
    pageable: Pageable,
    teamId: ULong
): Page<TeamUserJoinUserAndInviterRecord> {
    val user = UserTable.alias("user")
    val inviter = UserTable.alias("inviter")

    val query = leftJoin(user, { TeamUserTable.userId }, { user[UserTable.id] })
        .leftJoin(inviter, { TeamUserTable.inviterId }, { inviter[UserTable.id] })
        .selectAll().where {
            (TeamUserTable.teamId eq teamId)
        }

    return pageQuery(
        query,
        pageable,
        sort = {
            when (it) {
                "id.user.name" -> user[UserTable.name]
                "id.user.id" -> user[UserTable.publicId]
                "role" -> TeamUserTable.role
                "invitedBy.name" -> inviter[UserTable.name]
                "invitedBy.email" -> inviter[UserTable.email]
                "createdAt" -> TeamUserTable.createdAt
                else -> null
            }
        },
        map = {
            TeamUserTable.rowToTeamUserJoinUserAndInviterRecord(
                it,
                user,
                inviter,
            )
        },
    )
}

fun TeamUserTable.findByTeamAndUserId(teamId: ULong, userId: ULong): TeamUserRecord? =
    selectAll().where {
        (TeamUserTable.teamId eq teamId) and (TeamUserTable.userId eq userId)
    }.firstOrNull()?.let {
        TeamUserTable.rowToTeamUserRecord(it)
    }

fun TeamUserTable.findJoinUserAndInviterByTeamAndUserId(
    teamId: ULong,
    userId: ULong
): TeamUserJoinUserAndInviterRecord? {
    val user = UserTable.alias("user")
    val inviter = UserTable.alias("inviter")

    return innerJoin(user, { TeamUserTable.userId }, { user[UserTable.id] })
        .innerJoin(inviter, { TeamUserTable.inviterId }, { inviter[UserTable.id] })
        .selectAll().where {
            (TeamUserTable.teamId eq teamId) and (TeamUserTable.userId eq userId)
        }.firstOrNull()?.let {
            TeamUserTable.rowToTeamUserJoinUserAndInviterRecord(it, user, inviter)
        }
}

fun TeamUserTable.findTeamIdsByUserId(userId: ULong): List<ULong> =
    select(TeamUserTable.teamId).where {
        TeamUserTable.userId eq userId
    }.map { it[TeamUserTable.teamId] }

fun TeamUserTable.deleteByTeamAndUserId(
    teamId: ULong,
    userId: ULong
) = deleteWhere {
    (TeamUserTable.teamId eq teamId) and (TeamUserTable.userId eq userId)
}
