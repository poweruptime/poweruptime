package org.poweruptime.backend.features.team.domain

import org.jetbrains.exposed.v1.core.alias
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greater
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.core.less
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.domain.pageQuery
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.features.authentication.model.UserTable
import org.poweruptime.backend.features.authentication.model.rowToUserRecord
import org.poweruptime.backend.features.team.model.TeamJoinTokenJoinInviteeAndInviter
import org.poweruptime.backend.features.team.model.TeamJoinTokenRecord
import org.poweruptime.backend.features.team.model.TeamJoinTokenTable
import org.poweruptime.backend.features.team.model.rowToTeamJoinTokenRecord
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant

fun TeamJoinTokenTable.countByTeamAndInviteeId(
    teamId: ULong,
    inviteeId: ULong
): Long = selectAll().where {
    (TeamJoinTokenTable.teamId eq teamId) and (TeamJoinTokenTable.inviteeId eq inviteeId)
}.count()

fun TeamJoinTokenTable.findValidByInviteeIdTokenAndCreatedAfter(
    inviteeId: ULong,
    token: String,
    createdAfter: Instant
): TeamJoinTokenRecord? = selectAll().where {
    (TeamJoinTokenTable.inviteeId eq inviteeId) and
        (TeamJoinTokenTable.id eq token) and
        (TeamJoinTokenTable.createdAt greater createdAfter) and
        (TeamJoinTokenTable.valid eq true)
}.firstOrNull()?.let {
    TeamJoinTokenTable.rowToTeamJoinTokenRecord(it)
}

fun TeamJoinTokenTable.invalidateByInviteeId(
    inviteeId: ULong
): Int = update({
    (TeamJoinTokenTable.inviteeId eq inviteeId) and (TeamJoinTokenTable.valid eq true)
}) {
    it[valid] = false
}

fun TeamJoinTokenTable.findAll(
    pageable: Pageable,
    teamId: ULong
): Page<TeamJoinTokenJoinInviteeAndInviter> {
    val invitee = UserTable.alias("invitee")
    val inviter = UserTable.alias("inviter")

    val query = innerJoin(invitee, { TeamJoinTokenTable.inviteeId }, { invitee[UserTable.id] })
        .innerJoin(inviter, { TeamJoinTokenTable.inviterId }, { inviter[UserTable.id] })
        .selectAll().where {
            (TeamJoinTokenTable.teamId eq teamId) and (TeamJoinTokenTable.valid eq true)
        }

    return pageQuery(
        query,
        pageable,
        sort = {
            when (it) {
                "invitee.email" -> invitee[UserTable.email]
                "inviter.email" -> inviter[UserTable.email]
                "role" -> TeamJoinTokenTable.role
                "createdAt" -> TeamJoinTokenTable.createdAt
                else -> throw BadRequestException(
                    """Sort parameter "$it" not found""",
                )
            }
        },
        map = {
            TeamJoinTokenJoinInviteeAndInviter(
                teamJoinToken = TeamJoinTokenTable.rowToTeamJoinTokenRecord(it),
                invitee = UserTable.rowToUserRecord(it, invitee),
                inviter = UserTable.rowToUserRecord(it, inviter),
            )
        },
    )
}

fun TeamJoinTokenTable.deleteOlderThan(
    before: Instant
): Int = deleteWhere {
    TeamJoinTokenTable.createdAt less before
}
