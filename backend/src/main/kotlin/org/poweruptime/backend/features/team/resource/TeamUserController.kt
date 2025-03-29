package org.poweruptime.backend.features.team.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.persistence.criteria.CriteriaBuilder
import jakarta.persistence.criteria.CriteriaQuery
import jakarta.persistence.criteria.Root
import jakarta.validation.Valid
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.*
import org.poweruptime.backend.core.dto.IdResponse
import org.poweruptime.backend.core.dto.PageableValidator
import org.poweruptime.backend.core.dto.PaginatedResponse
import org.poweruptime.backend.core.dto.toDto
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.core.exceptions.ForbiddenException
import org.poweruptime.backend.core.exceptions.TooManyRequestsException
import org.poweruptime.backend.core.utils.orThrowNotFound
import org.poweruptime.backend.features.authentication.permission.TEAM_ADMIN
import org.poweruptime.backend.features.authentication.service.AuthService
import org.poweruptime.backend.features.team.domain.TeamUserRepository
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
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/team/{teamId}")
@Tag(name = "Team User API")
class TeamUserController(
    private val teamUserRepository: TeamUserRepository,
    private val authService: AuthService,
    private val teamService: TeamService,
    private val teamJoinTokenService: TeamJoinTokenService,
    private val userService: UserService
) {
    @Operation(
        summary = "Get users from team",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_ADMIN",
    )
    @PreAuthorize("hasPermission(#teamId, '$TEAM_ADMIN')")
    @GetMapping("/user")
    @ResponseStatus(HttpStatus.OK)
    fun getUsers(
        @ParameterObject @PageableDefault pageable: Pageable,
        @PathVariable("teamId") teamId: String,
    ): PaginatedResponse<TeamUserResponse> =
        teamUserRepository.findAll(
            { root: Root<TeamUser>, _: CriteriaQuery<*>?, criteriaBuilder: CriteriaBuilder ->
                criteriaBuilder.and(Filter("id.team.id", teamId, FilterCompare.EQ).toPredicate(root, criteriaBuilder))
            },
            PageableValidator.validateSort(
                pageable,
                listOf("id.user.name", "id.user.id", "role", "invitedBy.name", "invitedBy.email", "createdAt"),
            ),
        ).toDto { TeamUserResponse(it) }

    @Operation(
        summary = "Get open invites from team",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_ADMIN",
    )
    @PreAuthorize("hasPermission(#teamId, '$TEAM_ADMIN')")
    @GetMapping("/invites")
    @ResponseStatus(HttpStatus.OK)
    fun getInvites(
        @ParameterObject @PageableDefault pageable: Pageable,
        @PathVariable("teamId") teamId: String,
    ): PaginatedResponse<TeamJoinTokenResponse> = teamJoinTokenService.getByTeamIdPaginated(pageable, teamId).toDto {
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
    fun inviteUserToJoinTeam(
        authentication: Authentication,
        @PathVariable("teamId") teamId: String,
        @RequestBody @Valid dto: InviteTeamUserDto,
    ): IdResponse {
        val inviter = authService.getByAuthOrThrow(authentication)
        val team = teamService.getByIdOrThrow(teamId)
        val invitee = userService.getByEmailOrThrow(dto.email)

        if (team.personalUser != null) {
            throw BadRequestException("Other users can only be added to non-personal teams.", "PERSONAL_TEAM")
        }

        if (teamUserRepository.findByTeamAndUserId(team.id, invitee.id) != null) {
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
    @PreAuthorize("hasPermission(#teamId, '$TEAM_ADMIN')")
    @PutMapping("/user")
    @ResponseStatus(HttpStatus.OK)
    fun updateUser(
        @PathVariable("teamId") teamId: String,
        @RequestBody @Valid dto: UpdateTeamUserDto,
    ): TeamUserResponse {
        val teamUser = teamUserRepository.findByTeamAndUserId(teamId, dto.userId).orThrowNotFound("User not in team")

        return TeamUserResponse(
            teamUserRepository.save(
                teamUser.apply {
                    role = dto.role
                },
            ),
        )
    }

    @Operation(
        summary = "Remove user from team",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_ADMIN",
    )
    @PreAuthorize("hasPermission(#teamId, '$TEAM_ADMIN')")
    @DeleteMapping("/user/{userId}")
    @ResponseStatus(HttpStatus.OK)
    fun removeUser(
        auth: Authentication,
        @PathVariable("teamId") teamId: String,
        @PathVariable("userId") userId: String
    ) {
        val teamId = teamService.existsByIdOrThrow(teamId)

        val toBeRemovedTeamUser = teamUserRepository.findByTeamAndUserId(teamId, userId)
            ?: throw ForbiddenException()

        if (toBeRemovedTeamUser.invitedBy == null) {
            throw BadRequestException("Can't remove creator")
        }

        val actorUser = authService.getByAuthOrThrow(auth)

        if (actorUser.id == userId) {
            throw BadRequestException("Can't remove yourself")
        }

        val actorTeamUser = teamUserRepository.findByTeamAndUserId(teamId, actorUser.id)
        // If actorTeamUser is null the actor is an admin
        if (actorTeamUser?.invitedBy?.id == userId) {
            throw BadRequestException("Can't remove the person who invited you")
        }

        teamUserRepository.delete(toBeRemovedTeamUser)
    }
}
