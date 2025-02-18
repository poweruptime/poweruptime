package org.poweruptime.backend.features.team.service

import jakarta.persistence.criteria.CriteriaBuilder
import jakarta.persistence.criteria.CriteriaQuery
import jakarta.persistence.criteria.Root
import org.poweruptime.backend.core.Filter
import org.poweruptime.backend.core.FilterCompare
import org.poweruptime.backend.core.dto.PageableValidator
import org.poweruptime.backend.core.service.AEntityService
import org.poweruptime.backend.core.toPredicate
import org.poweruptime.backend.core.utils.RandomGenerator
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.mail.emails.JoinTeamEmail
import org.poweruptime.backend.features.mail.service.SystemEmailService
import org.poweruptime.backend.features.team.domain.TeamJoinTokenRepository
import org.poweruptime.backend.features.team.model.Team
import org.poweruptime.backend.features.team.model.TeamJoinToken
import org.poweruptime.backend.features.team.model.TeamRole
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import java.time.Instant

const val MAX_TEAM_JOIN_TOKENS_PER_USER_AND_TEAM_IN_3_DAYS = 3

@Service
class TeamJoinTokenService(
    private val teamJoinTokenRepository: TeamJoinTokenRepository,
    private val systemEmailService: SystemEmailService
) : AEntityService<TeamJoinToken>(teamJoinTokenRepository) {

    fun getByTeamIdPaginated(pageable: Pageable, teamId: String) = teamJoinTokenRepository.findAll(
        { root: Root<TeamJoinToken>, _: CriteriaQuery<*>?, criteriaBuilder: CriteriaBuilder ->
            criteriaBuilder.and(
                *buildList {
                    add(Filter("team.id", teamId, FilterCompare.EQ))
                    add(Filter("version", 0, FilterCompare.EQ))
                }.toPredicate(root, criteriaBuilder).toTypedArray(),
            )
        },
        PageableValidator.validateSort(
            pageable,
            listOf("invitee.email", "inviter.email", "role", "createdAt"),
        ),
    )

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

    fun validateToken(inviteeId: String, token: String): TeamJoinToken? {
        val joinToken = teamJoinTokenRepository.findValidByInviteeIdAndTokenAndCreatedAfter(
            inviteeId = inviteeId,
            token = token,
            createdAfter = Instant.now().minusSeconds(
                MAX_TEAM_JOIN_TOKENS_PER_USER_AND_TEAM_IN_3_DAYS * 24L * 60L * 60L,
            ),
        )

        joinToken?.let {
            saveAll(
                buildList {
                    add(it)
                    addAll(teamJoinTokenRepository.findValidByInviteeId(inviteeId))
                }.onEach { it.invalidateToken() },
            )
        }

        return joinToken
    }

    fun deleteOlderThan(past: Instant) = teamJoinTokenRepository.findOlderThan(past).apply {
        deleteAll(this)
    }

    private fun TeamJoinToken.invalidateToken(): TeamJoinToken = apply {
        this.touch()
    }
}
