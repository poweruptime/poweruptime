package org.poweruptime.backend.features.team.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.REQUIRED_AUTH
import org.poweruptime.backend.core.SYSTEM_ROLE_ADMIN
import org.poweruptime.backend.core.dto.PaginatedResponse
import org.poweruptime.backend.core.dto.toDto
import org.poweruptime.backend.core.exceptions.ForbiddenException
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.authentication.permission.TEAM_ADMIN
import org.poweruptime.backend.features.authentication.permission.TEAM_MEMBER
import org.poweruptime.backend.features.authentication.service.AuthService
import org.poweruptime.backend.features.instanceSetting.InstanceSettingService
import org.poweruptime.backend.features.monitor.service.MonitorService
import org.poweruptime.backend.features.team.dto.CreateTeamDto
import org.poweruptime.backend.features.team.dto.TeamResponse
import org.poweruptime.backend.features.team.dto.UpdateTeamDto
import org.poweruptime.backend.features.team.model.Team
import org.poweruptime.backend.features.team.service.TeamService
import org.springdoc.core.annotations.ParameterObject
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/team")
@Tag(name = "Team API")
class TeamController(
    private val teamService: TeamService,
    private val monitorService: MonitorService,
    private val authService: AuthService,
    private val instanceSettingService: InstanceSettingService,
) {

    @Operation(
        summary = "Add team",
        security = [SecurityRequirement(name = BEARER_AUTH)],
    )
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        authentication: Authentication,
        @RequestBody @Valid dto: CreateTeamDto
    ): TeamResponse = authService.getByAuthOrThrow(authentication).let {
        if (!it.isAdmin() && !instanceSettingService.getUserAllowedToCreateTeams()) {
            throw ForbiddenException("User not allowed to create teams")
        }

        teamService.create(dto, it).toResponse(it)
    }

    @Operation(
        summary = "Get team",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_MEMBER",
    )
    @PreAuthorize("hasPermission(#id, '$TEAM_MEMBER')")
    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun get(authentication: Authentication, @PathVariable id: String): TeamResponse =
        teamService.getByIdOrThrow(id).toResponse(authService.getByAuthOrThrow(authentication))

    @Operation(
        summary = "Get all teams, if global admin return all teams, else user specific teams",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_MEMBER",
    )
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    fun getAll(
        authentication: Authentication,
        @ParameterObject @PageableDefault pageable: Pageable,
        @RequestParam("name") name: String?,
        @RequestParam("deleted") deleted: Boolean = false,
    ): PaginatedResponse<TeamResponse> {
        val user = authService.getByAuthOrThrow(authentication)

        return teamService.getAllPaginated(
            pageable = pageable,
            userId = if (user.isAdmin()) {
                null
            } else {
                user.id
            },
            name = name,
            deleted = deleted,
        ).toDto { it.toResponse(user) }
    }

    @Operation(
        summary = "Update team",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_ADMIN",
    )
    @PreAuthorize("hasPermission(#dto.id, '$TEAM_ADMIN')")
    @PutMapping
    @ResponseStatus(HttpStatus.OK)
    fun update(authentication: Authentication, @RequestBody @Valid dto: UpdateTeamDto): TeamResponse =
        teamService.update(dto).toResponse(authService.getByAuthOrThrow(authentication))

    @Operation(
        summary = "Delete team",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_ADMIN",
    )
    @PreAuthorize("hasPermission(#id, '$TEAM_ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun delete(@PathVariable("id") id: String): Unit = teamService.deleteByIdOrThrow(id)

    @Operation(
        summary = "Undelete team",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_ADMIN",
    )
    @PreAuthorize("hasPermission(#id, '$TEAM_ADMIN')")
    @DeleteMapping("/{id}/undo")
    @ResponseStatus(HttpStatus.OK)
    fun undelete(authentication: Authentication, @PathVariable("id") id: String): TeamResponse =
        teamService.undeleteById(id).toResponse(authService.getByAuthOrThrow(authentication))

    private fun Team.toResponse(user: User): TeamResponse = TeamResponse(
        this,
        this.personalUser?.id == user.id,
        monitorService.getTeamDashboard(this.id),
    )
}
