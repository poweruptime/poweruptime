package org.poweruptime.backend.features.team.service

import org.poweruptime.backend.core.service.AEntityService
import org.poweruptime.backend.core.utils.RandomGenerator
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.mail.emails.JoinTeamEmail
import org.poweruptime.backend.features.mail.service.SystemEmailService
import org.poweruptime.backend.features.team.domain.TeamJoinTokenRepository
import org.poweruptime.backend.features.team.model.Team
import org.poweruptime.backend.features.team.model.TeamJoinToken
import org.poweruptime.backend.features.team.model.TeamRole
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class TeamJoinTokenService(
    private val teamJoinTokenRepository: TeamJoinTokenRepository,
    private val systemEmailService: SystemEmailService
) : AEntityService<TeamJoinToken>(teamJoinTokenRepository) {

    fun countByTeamIdAndInviteeId(teamId: String, inviteeId: String) =
        teamJoinTokenRepository.countByTeamIdAndInviteeId(teamId, inviteeId)

    fun create(inviterTeam: Team, inviter: User, invitee: User, role: TeamRole): TeamJoinToken = save(
        TeamJoinToken(
            token = RandomGenerator.nanoId(20),
            team = inviterTeam,
            invitee = invitee,
            inviter = inviter,
            role = role,
        ),
    ).apply {
        systemEmailService.queueEmail(
            JoinTeamEmail(
                inviterTeam = inviterTeam,
                inviter = inviter,
                invitee = invitee,
                token = token,
            ),
        )
    }

    fun validateToken(inviteeId: String, token: String) =
        teamJoinTokenRepository.findValidByInviteeIdTokenAndCreatedAfter(
            inviteeId = inviteeId,
            token = token,
            createdAfter = Instant.now().minusSeconds(3 * 60 * 60), // 3 hours
        )?.apply {
            invalidateToken(this)
        }

    fun deleteOlderThan(past: Instant) = teamJoinTokenRepository.findOlderThan(past).apply {
        deleteAll(this)
    }

    private fun invalidateToken(joinToken: TeamJoinToken) = joinToken.let {
        it.touch()
        save(joinToken)
    }
}
