package org.poweruptime.backend.features.team.service

import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.poweruptime.backend.core.domain.Page
import org.poweruptime.backend.core.dto.Pageable
import org.poweruptime.backend.features.authentication.model.UserRecord
import org.poweruptime.backend.features.mail.emails.JoinTeamEmail
import org.poweruptime.backend.features.mail.service.SystemEmailService
import org.poweruptime.backend.features.team.domain.countByTeamAndInviteeId
import org.poweruptime.backend.features.team.domain.deleteOlderThan
import org.poweruptime.backend.features.team.domain.findAll
import org.poweruptime.backend.features.team.domain.findValidByInviteeIdTokenAndCreatedAfter
import org.poweruptime.backend.features.team.domain.invalidateByInviteeId
import org.poweruptime.backend.features.team.model.TeamJoinToken
import org.poweruptime.backend.features.team.model.TeamJoinTokenJoinInviteeAndInviter
import org.poweruptime.backend.features.team.model.TeamJoinTokenRecord
import org.poweruptime.backend.features.team.model.TeamRecord
import org.poweruptime.backend.features.team.model.TeamRole
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

const val MAX_TEAM_JOIN_TOKENS_PER_USER_AND_TEAM_IN_3_DAYS = 3
const val THREE_DAYS_IN_SECONDS = 3L * 24L * 60L * 60L

@Service
@Transactional(readOnly = true)
class TeamJoinTokenService(
    private val systemEmailService: SystemEmailService
) {

    fun getByTeamIdPaginated(pageable: Pageable, teamId: ULong): Page<TeamJoinTokenJoinInviteeAndInviter> =
        TeamJoinToken.findAll(pageable, teamId)

    fun countByTeamIdAndInviteeId(teamId: ULong, inviteeId: ULong) =
        TeamJoinToken.countByTeamAndInviteeId(teamId, inviteeId)

    @Transactional
    fun create(inviterTeam: TeamRecord, inviter: UserRecord, invitee: UserRecord, role: TeamRole): String =
        TeamJoinToken.insertAndGetId {
            it[TeamJoinToken.teamId] = inviterTeam.id
            it[TeamJoinToken.inviteeId] = invitee.id
            it[TeamJoinToken.inviterId] = inviter.id
            it[TeamJoinToken.role] = role
        }.value
            .also {
                systemEmailService.queueEmail(
                    JoinTeamEmail(
                        inviterTeam = inviterTeam,
                        inviter = inviter,
                        invitee = invitee,
                        token = it,
                    ),
                )
            }

    @Transactional
    fun validateToken(inviteeId: ULong, token: String): TeamJoinTokenRecord? {
        val joinToken = TeamJoinToken.findValidByInviteeIdTokenAndCreatedAfter(
            inviteeId = inviteeId,
            token = token,
            createdAfter = Instant.now().minusSeconds(THREE_DAYS_IN_SECONDS),
        )

        if (joinToken != null) {
            TeamJoinToken.invalidateByInviteeId(inviteeId)
        }

        return joinToken
    }

    @Transactional
    fun deleteOlderThan(past: Instant): Int = TeamJoinToken.deleteOlderThan(past)
}
