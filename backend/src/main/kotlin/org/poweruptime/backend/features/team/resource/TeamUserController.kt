package org.poweruptime.backend.features.team.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.REQUIRED_AUTH
import org.poweruptime.backend.core.SYSTEM_ROLE_ADMIN
import org.poweruptime.backend.core.dto.IdResponse
import org.poweruptime.backend.core.dto.PaginatedResponse
import org.poweruptime.backend.core.dto.toDto
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.core.exceptions.ForbiddenException
import org.poweruptime.backend.core.exceptions.TooManyRequestsException
import org.poweruptime.backend.core.utils.orThrowNotFound
import org.poweruptime.backend.features.authentication.permission.TEAM_ADMIN
import org.poweruptime.backend.features.authentication.service.user
import org.poweruptime.backend.features.authentication.service.userId
import org.poweruptime.backend.features.team.domain.deleteByTeamAndUserId
import org.poweruptime.backend.features.team.domain.findAll
import org.poweruptime.backend.features.team.domain.findByTeamAndUserId
import org.poweruptime.backend.features.team.domain.findJoinUserAndInviterByTeamAndUserId
import org.poweruptime.backend.features.team.dto.InviteTeamUserDto
import org.poweruptime.backend.features.team.dto.TeamJoinTokenResponse
import org.poweruptime.backend.features.team.dto.TeamUserResponse
import org.poweruptime.backend.features.team.dto.UpdateTeamUserDto
import org.poweruptime.backend.features.team.model.TeamUser
import org.poweruptime.backend.features.team.service.MAX_TEAM_JOIN_TOKENS_PER_USER_AND_TEAM_IN_3_DAYS
import org.poweruptime.backend.features.team.service.TeamJoinTokenService
import org.poweruptime.backend.features.team.service.TeamService
import org.poweruptime.backend.features.user.service.UserService
import org.springdoc.core.annotations.ParameterObject
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/team/{teamId}")
@Tag(name = "Team User API")
class TeamUserController(
    private val teamService: TeamService,
    private val teamJoinTokenService: TeamJoinTokenService,
    private val userService: UserService
) {
    @Operation(
        summary = "Get users from team",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_ADMIN",
    )
    @PreAuthorize("hasPermission(#publicTeamId, '$TEAM_ADMIN')")
    @GetMapping("/user")
    @ResponseStatus(HttpStatus.OK)
    @Transactional(readOnly = true)
    fun getUsers(
        @ParameterObject @PageableDefault pageable: Pageable,
        @PathVariable("teamId") publicTeamId: String,
    ): PaginatedResponse<TeamUserResponse> =
        TeamUser.findAll(pageable, teamService.getIdByPublicId(publicTeamId))
            .toDto { TeamUserResponse(it) }

    @Operation(
        summary = "Get open invites from team",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_ADMIN",
    )
    @PreAuthorize("hasPermission(#publicTeamId, '$TEAM_ADMIN')")
    @GetMapping("/invites")
    @ResponseStatus(HttpStatus.OK)
    fun getInvites(
        @ParameterObject @PageableDefault pageable: Pageable,
        @PathVariable("teamId") publicTeamId: String,
    ): PaginatedResponse<TeamJoinTokenResponse> = teamJoinTokenService.getByTeamIdPaginated(
        pageable,
        teamService.getIdByPublicId(publicTeamId),
    ).toDto {
        TeamJoinTokenResponse(it)
    }

    @Operation(
        summary = "Invite user to join team",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_ADMIN",
    )
    @PreAuthorize("hasPermission(#teamId, '$TEAM_ADMIN')")
    @PostMapping("/user")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    fun inviteUserToJoinTeam(
        authentication: Authentication,
        @PathVariable("teamId") teamId: String,
        @RequestBody @Valid dto: InviteTeamUserDto,
    ): IdResponse {
        val inviter = authentication.user()
        val team = teamService.getByPublicId(teamId)
        val invitee = userService.getByEmail(dto.email)

        if (team.personalUserId != null) {
            throw BadRequestException("Other users can only be added to non-personal teams.", "PERSONAL_TEAM")
        }

        if (TeamUser.findByTeamAndUserId(team.id, invitee.id) != null) {
            throw BadRequestException("User already in team", "ALREADY_IN_TEAM")
        }

        if (teamJoinTokenService.countByTeamIdAndInviteeId(team.id, invitee.id) >=
            MAX_TEAM_JOIN_TOKENS_PER_USER_AND_TEAM_IN_3_DAYS
        ) {
            throw TooManyRequestsException("User was invited too often in short time")
        }

        return IdResponse(
            teamJoinTokenService.create(
                inviterTeam = team,
                inviter = inviter,
                invitee = invitee,
                role = dto.role,
            ),
        )
    }

    @Operation(
        summary = "Update user in team",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_ADMIN",
    )
    @PreAuthorize("hasPermission(#publicTeamId, '$TEAM_ADMIN')")
    @PutMapping("/user")
    @ResponseStatus(HttpStatus.OK)
    @Transactional
    fun updateUser(
        @PathVariable("teamId") publicTeamId: String,
        @RequestBody @Valid dto: UpdateTeamUserDto,
    ): TeamUserResponse {
        val teamId = teamService.getIdByPublicId(publicTeamId)
        val userId = userService.getIdByPublicId(dto.userId)
        TeamUser.findByTeamAndUserId(
            teamId = teamId,
            userId = userId,
        ).orThrowNotFound("User not in team")

        TeamUser.update({
            (TeamUser.teamId eq teamId) and (TeamUser.userId eq userId)
        }) {
            it[role] = dto.role
        }

        return TeamUserResponse(
            TeamUser.findJoinUserAndInviterByTeamAndUserId(teamId, userId)!!,
        )
    }

    @Operation(
        summary = "Remove user from team",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_ADMIN",
    )
    @PreAuthorize("hasPermission(#publicTeamId, '$TEAM_ADMIN')")
    @DeleteMapping("/user/{userId}")
    @ResponseStatus(HttpStatus.OK)
    @Transactional
    fun removeUser(
        auth: Authentication,
        @PathVariable("teamId") publicTeamId: String,
        @PathVariable("userId") publicUserId: String
    ) {
        val teamId = teamService.getIdByPublicId(publicTeamId)
        val userId = userService.getIdByPublicId(publicUserId)

        val toBeRemovedTeamUser = TeamUser.findByTeamAndUserId(teamId, userId)
            ?: throw ForbiddenException()

        if (toBeRemovedTeamUser.inviterId == null) {
            throw BadRequestException("Can't remove creator")
        }

        val actorUserId = auth.userId()

        if (actorUserId == userId) {
            throw BadRequestException("Can't remove yourself")
        }

        val actorTeamUser = TeamUser.findByTeamAndUserId(teamId, actorUserId)
        // If actorTeamUser is null the actor is an admin
        if (actorTeamUser?.inviterId == userId) {
            throw BadRequestException("Can't remove the person who invited you")
        }

        TeamUser.deleteByTeamAndUserId(teamId, userId)
    }
}
