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
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.authentication.model.rowToUserRecord
import org.poweruptime.backend.features.team.model.TeamJoinToken
import org.poweruptime.backend.features.team.model.TeamJoinTokenJoinInviteeAndInviter
import org.poweruptime.backend.features.team.model.TeamJoinTokenRecord
import org.poweruptime.backend.features.team.model.rowToTeamJoinTokenRecord
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant

fun TeamJoinToken.countByTeamAndInviteeId(
    teamId: ULong,
    inviteeId: ULong
): Long = selectAll().where {
    (TeamJoinToken.teamId eq teamId) and (TeamJoinToken.inviteeId eq inviteeId)
}.count()

fun TeamJoinToken.findValidByInviteeIdTokenAndCreatedAfter(
    inviteeId: ULong,
    token: String,
    createdAfter: Instant
): TeamJoinTokenRecord? = selectAll().where {
    (TeamJoinToken.inviteeId eq inviteeId) and
        (TeamJoinToken.id eq token) and
        (TeamJoinToken.createdAt greater createdAfter) and
        (TeamJoinToken.valid eq true)
}.firstOrNull()?.let {
    TeamJoinToken.rowToTeamJoinTokenRecord(it)
}

fun TeamJoinToken.invalidateByInviteeId(
    inviteeId: ULong
): Int = update({
    (TeamJoinToken.inviteeId eq inviteeId) and (TeamJoinToken.valid eq true)
}) {
    it[valid] = false
}

fun TeamJoinToken.findAll(
    pageable: Pageable,
    teamId: ULong
): Page<TeamJoinTokenJoinInviteeAndInviter> {
    val invitee = User.alias("invitee")
    val inviter = User.alias("inviter")

    val query = innerJoin(invitee, { TeamJoinToken.inviteeId }, { invitee[User.id] })
        .innerJoin(inviter, { TeamJoinToken.inviterId }, { inviter[User.id] })
        .selectAll().where {
            (TeamJoinToken.teamId eq teamId) and (TeamJoinToken.valid eq true)
        }

    return pageQuery(
        query,
        pageable,
        sort = {
            when (it) {
                "invitee.email" -> invitee[User.email]
                "inviter.email" -> inviter[User.email]
                "role" -> TeamJoinToken.role
                "createdAt" -> TeamJoinToken.createdAt
                else -> throw BadRequestException(
                    """Sort parameter "$it" not found""",
                )
            }
        },
        map = {
            TeamJoinTokenJoinInviteeAndInviter(
                teamJoinToken = TeamJoinToken.rowToTeamJoinTokenRecord(it),
                invitee = User.rowToUserRecord(it, invitee),
                inviter = User.rowToUserRecord(it, inviter),
            )
        },
    )
}

fun TeamJoinToken.deleteOlderThan(
    before: Instant
): Int = deleteWhere {
    TeamJoinToken.createdAt less before
}
