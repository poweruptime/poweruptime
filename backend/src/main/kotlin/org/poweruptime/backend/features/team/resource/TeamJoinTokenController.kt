package org.poweruptime.backend.features.team.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.jetbrains.exposed.v1.jdbc.insert
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.REQUIRED_AUTH
import org.poweruptime.backend.core.SYSTEM_ROLE_USER
import org.poweruptime.backend.core.exceptions.UnauthorizedException
import org.poweruptime.backend.features.authentication.service.userId
import org.poweruptime.backend.features.team.domain.findByTeamAndUserId
import org.poweruptime.backend.features.team.dto.TeamMinResponse
import org.poweruptime.backend.features.team.model.TeamUserTable
import org.poweruptime.backend.features.team.service.TeamJoinTokenService
import org.poweruptime.backend.features.team.service.TeamService
import org.springframework.http.HttpStatus
import org.springframework.security.core.Authentication
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/team/join")
@Tag(name = "Team User API")
class TeamJoinTokenController(
    private val teamService: TeamService,
    private val teamJoinTokenService: TeamJoinTokenService,
) {
    @Operation(
        summary = "Join team",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_USER",
    )
    @GetMapping("/{token}")
    @ResponseStatus(HttpStatus.OK)
    @Transactional
    fun joinTeam(
        @PathVariable("token") token: String,
        authentication: Authentication
    ): TeamMinResponse {
        val inviteeId = authentication.userId()
        val joinToken = teamJoinTokenService.validateToken(
            inviteeId = inviteeId,
            token = token,
        ) ?: throw UnauthorizedException()

        if (TeamUserTable.findByTeamAndUserId(joinToken.teamId, inviteeId) != null) {
            throw UnauthorizedException()
        }

        TeamUserTable.insert {
            it[teamId] = joinToken.teamId
            it[userId] = inviteeId
            it[role] = joinToken.role
            it[inviterId] = joinToken.inviterId
        }

        return TeamMinResponse(teamService.getById(joinToken.teamId))
    }
}
