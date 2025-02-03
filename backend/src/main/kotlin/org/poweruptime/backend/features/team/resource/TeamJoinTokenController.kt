package org.poweruptime.backend.features.team.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.REQUIRED_AUTH
import org.poweruptime.backend.core.SYSTEM_ROLE_USER
import org.poweruptime.backend.core.exceptions.UnauthorizedException
import org.poweruptime.backend.features.authentication.service.AuthService
import org.poweruptime.backend.features.team.domain.TeamUserRepository
import org.poweruptime.backend.features.team.dto.MinTeamResponse
import org.poweruptime.backend.features.team.model.TeamUser
import org.poweruptime.backend.features.team.model.TeamUserId
import org.poweruptime.backend.features.team.service.TeamJoinTokenService
import org.springframework.http.HttpStatus
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/team/join")
@Tag(name = "Team User API")
class TeamJoinTokenController(
    private val teamUserRepository: TeamUserRepository,
    private val authService: AuthService,
    private val teamJoinTokenService: TeamJoinTokenService,
) {
    @Operation(
        summary = "Join team",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_USER",
    )
    @GetMapping("/{token}")
    @ResponseStatus(HttpStatus.OK)
    fun joinTeam(
        @PathVariable("token") token: String,
        authentication: Authentication
    ): MinTeamResponse {
        val invitee = authService.getByAuthOrThrow(authentication)
        val joinToken = teamJoinTokenService.validateToken(
            inviteeId = invitee.id,
            token = token,
        ) ?: throw UnauthorizedException()

        if (teamUserRepository.findByTeamAndUserEmail(joinToken.team.id, invitee.id) != null) {
            throw UnauthorizedException()
        }

        teamUserRepository.save(
            TeamUser(
                id = TeamUserId(
                    team = joinToken.team,
                    user = invitee,
                ),
                role = joinToken.role,
                invitedBy = joinToken.inviter,
            ),
        )

        return MinTeamResponse(joinToken.team)
    }
}
