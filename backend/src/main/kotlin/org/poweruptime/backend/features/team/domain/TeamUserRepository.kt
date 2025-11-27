package org.poweruptime.backend.features.team.domain

import org.jetbrains.exposed.v1.core.alias
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.core.leftJoin
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.core.domain.Page
import org.poweruptime.backend.core.domain.pageQuery
import org.poweruptime.backend.core.dto.Pageable
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.team.model.TeamUser
import org.poweruptime.backend.features.team.model.TeamUserJoinUserAndInviterRecord
import org.poweruptime.backend.features.team.model.TeamUserRecord
import org.poweruptime.backend.features.team.model.rowToTeamUserJoinUserAndInviterRecord
import org.poweruptime.backend.features.team.model.rowToTeamUserRecord

fun TeamUser.findAll(
    pageable: Pageable,
    teamId: ULong
): Page<TeamUserJoinUserAndInviterRecord> {
    val user = User.alias("user")
    val inviter = User.alias("inviter")

    val query = leftJoin(user, { TeamUser.userId }, { user[User.id] })
        .leftJoin(inviter, { TeamUser.inviterId }, { inviter[User.id] })
        .selectAll().where {
            (TeamUser.teamId eq teamId)
        }

    return pageQuery(
        query,
        pageable,
        sort = {
            when (it) {
                "id.user.name" -> user[User.name]
                "id.user.id" -> user[User.publicId]
                "role" -> TeamUser.role
                "invitedBy.name" -> inviter[User.name]
                "invitedBy.email" -> inviter[User.email]
                "createdAt" -> TeamUser.createdAt
                else -> null
            }
        },
        map = {
            TeamUser.rowToTeamUserJoinUserAndInviterRecord(
                it,
                user,
                inviter,
            )
        },
    )
}

fun TeamUser.findByTeamAndUserId(teamId: ULong, userId: ULong): TeamUserRecord? =
    selectAll().where {
        (TeamUser.teamId eq teamId) and (TeamUser.userId eq userId)
    }
        .limit(1)
        .firstOrNull()
        ?.let {
            rowToTeamUserRecord(it)
        }

fun TeamUser.findJoinUserAndInviterByTeamAndUserId(
    teamId: ULong,
    userId: ULong
): TeamUserJoinUserAndInviterRecord? {
    val user = User.alias("user")
    val inviter = User.alias("inviter")

    return innerJoin(user, { TeamUser.userId }, { user[User.id] })
        .innerJoin(inviter, { TeamUser.inviterId }, { inviter[User.id] })
        .selectAll().where {
            (TeamUser.teamId eq teamId) and (TeamUser.userId eq userId)
        }.limit(1)
        .firstOrNull()
        ?.let {
            rowToTeamUserJoinUserAndInviterRecord(it, user, inviter)
        }
}

fun TeamUser.findTeamIdsByUserId(userId: ULong): List<ULong> =
    select(teamId).where {
        TeamUser.userId eq userId
    }.map { it[TeamUser.teamId] }

fun TeamUser.deleteByTeamAndUserId(
    teamId: ULong,
    userId: ULong
) = deleteWhere {
    (TeamUser.teamId eq teamId) and (TeamUser.userId eq userId)
}
