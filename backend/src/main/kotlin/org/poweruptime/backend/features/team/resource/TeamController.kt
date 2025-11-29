package org.poweruptime.backend.features.team.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.REQUIRED_AUTH
import org.poweruptime.backend.core.SYSTEM_ROLE_ADMIN
import org.poweruptime.backend.core.dto.Pageable
import org.poweruptime.backend.core.dto.PaginatedResponse
import org.poweruptime.backend.core.dto.toDto
import org.poweruptime.backend.core.exceptions.ForbiddenException
import org.poweruptime.backend.features.authentication.domain.PermissionsService
import org.poweruptime.backend.features.authentication.permission.TEAM_ADMIN
import org.poweruptime.backend.features.authentication.permission.TEAM_MEMBER
import org.poweruptime.backend.features.authentication.service.isAdmin
import org.poweruptime.backend.features.authentication.service.publicUserId
import org.poweruptime.backend.features.authentication.service.userId
import org.poweruptime.backend.features.info.instanceSetting.InstanceSettingService
import org.poweruptime.backend.features.monitor.dto.MonitorDashboardResponse
import org.poweruptime.backend.features.monitor.service.MonitorService
import org.poweruptime.backend.features.team.dto.CreateTeamDto
import org.poweruptime.backend.features.team.dto.TeamMaxResponse
import org.poweruptime.backend.features.team.dto.TeamResponse
import org.poweruptime.backend.features.team.dto.UpdateTeamDto
import org.poweruptime.backend.features.team.model.TeamRecord
import org.poweruptime.backend.features.team.model.TeamRole
import org.poweruptime.backend.features.team.service.TeamService
import org.springdoc.core.annotations.ParameterObject
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/team")
@Tag(name = "Team API")
class TeamController(
    private val teamService: TeamService,
    private val monitorService: MonitorService,
    private val instanceSettingService: InstanceSettingService,
    private val permissionsService: PermissionsService,
) {
    @Operation(
        summary = "Get team",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_MEMBER",
    )
    @PreAuthorize("hasPermission(#publicId, '$TEAM_MEMBER')")
    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun get(authentication: Authentication, @PathVariable("id") publicId: String): TeamMaxResponse =
        teamService.getIdByPublicId(publicId).let { id ->
            teamService.getById(id)
        }.toMaxResponse(authentication)

    @Operation(
        summary = "Get all teams, if global admin return all teams, else user specific teams",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_MEMBER",
    )
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    fun getAll(
        authentication: Authentication,
        @ParameterObject pageable: Pageable,
        @RequestParam("name") name: String?,
        @RequestParam("role") role: TeamRole?,
        @RequestParam("deleted") deleted: Boolean = false,
    ): PaginatedResponse<TeamResponse> {
        val teams = teamService.getAllPaginated(
            pageable = pageable,
            userId = if (authentication.isAdmin()) {
                null
            } else {
                authentication.userId()
            },
            name = name,
            deleted = deleted,
            role = role,
        )

        val dashboards = monitorService.getTeamDashboards(teams.map { it.id }.content)

        return teams.toDto {
            it.toResponse(
                authentication.userId(),
                dashboards[it.id] ?: MonitorDashboardResponse(),
            )
        }
    }

    @Operation(
        summary = "Add team",
        security = [SecurityRequirement(name = BEARER_AUTH)],
    )
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        auth: Authentication,
        @RequestBody @Valid dto: CreateTeamDto
    ): TeamMaxResponse {
        if (!auth.isAdmin() && !instanceSettingService.getUserAllowedToCreateTeams()) {
            throw ForbiddenException("User not allowed to create teams")
        }

        return teamService.create(
            dto,
            creatorId = auth.userId(),
        ).toMaxResponse(auth, TeamRole.ADMIN)
    }

    @Operation(
        summary = "Update team",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_ADMIN",
    )
    @PreAuthorize("hasPermission(#dto.id, '$TEAM_ADMIN')")
    @PutMapping
    @ResponseStatus(HttpStatus.OK)
    fun update(authentication: Authentication, @RequestBody @Valid dto: UpdateTeamDto): TeamMaxResponse =
        teamService.update(dto).toMaxResponse(authentication)

    @Operation(
        summary = "Delete team",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_ADMIN",
    )
    @PreAuthorize("hasPermission(#publicId, '$TEAM_ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun delete(@PathVariable("id") publicId: String) {
        val teamId = teamService.getIdByPublicId(publicId)
        teamService.deleteById(teamId)
    }

    @Operation(
        summary = "Undelete team",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_ADMIN",
    )
    @PreAuthorize("hasPermission(#publicId, '$TEAM_ADMIN')")
    @DeleteMapping("/{id}/undo")
    @ResponseStatus(HttpStatus.OK)
    fun undelete(authentication: Authentication, @PathVariable("id") publicId: String): TeamMaxResponse =
        teamService.getIdByPublicId(publicId, includeDeleted = true).let { id ->
            teamService.undeleteById(id).toMaxResponse(authentication)
        }

    private fun TeamRecord.toResponse(userId: ULong, dashboard: MonitorDashboardResponse): TeamResponse = TeamResponse(
        team = this,
        yourPersonal = personalUserId == userId,
        dashboard = dashboard,
    )

    fun TeamRecord.toMaxResponse(
        authentication: Authentication,
        role: TeamRole? = null,
    ) = TeamMaxResponse(
        team = this,
        yourPersonal = personalUserId == authentication.userId(),
        dashboard = monitorService.getTeamDashboard(id),
        role = if (authentication.isAdmin()) {
            TeamRole.ADMIN
        } else {
            role ?: permissionsService.findByTeamId(
                publicUserId = authentication.publicUserId(),
                publicTeamId = publicId,
            )?.role ?: throw ForbiddenException("User not in team")
        },
    )
}
