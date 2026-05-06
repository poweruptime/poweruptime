package org.poweruptime.backend.features.maintenance.resource

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
import org.poweruptime.backend.features.authentication.permission.MAINTENANCE_ADMIN
import org.poweruptime.backend.features.authentication.permission.MAINTENANCE_MEMBER
import org.poweruptime.backend.features.authentication.permission.TEAM_ADMIN
import org.poweruptime.backend.features.authentication.permission.TEAM_MEMBER
import org.poweruptime.backend.features.maintenance.dto.CreateMaintenanceDto
import org.poweruptime.backend.features.maintenance.dto.MaintenanceResponse
import org.poweruptime.backend.features.maintenance.dto.UpdateMaintenanceDto
import org.poweruptime.backend.features.maintenance.service.MaintenanceService
import org.poweruptime.backend.features.maintenance.service.MaintenanceState
import org.poweruptime.backend.features.team.service.TeamService
import org.springdoc.core.annotations.ParameterObject
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
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
@RequestMapping("/v1/maintenance")
@Tag(name = "Maintenance API")
class MaintenanceController(private val maintenanceService: MaintenanceService, private val teamService: TeamService) {
    @Operation(
        summary = "Get all maintenances of team",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_MEMBER",
    )
    @PreAuthorize("hasPermission(#publicTeamId, '$TEAM_MEMBER')")
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    fun getAll(
        @ParameterObject pageable: Pageable,
        @RequestParam("teamId") publicTeamId: String,
        @RequestParam("state") state: MaintenanceState?,
    ): PaginatedResponse<MaintenanceResponse> {
        val teamId = teamService.getIdByPublicId(publicTeamId)
        return maintenanceService.getAllPaginated(pageable, teamId, state).toDto {
            MaintenanceResponse(it, maintenanceService.getMonitors(it.id))
        }
    }

    @Operation(
        summary = "Get maintenance",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_MEMBER",
    )
    @PreAuthorize("hasPermission(#publicId, '$MAINTENANCE_MEMBER')")
    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun get(@PathVariable("id") publicId: String): MaintenanceResponse =
        maintenanceService.getByPublicId(publicId).let {
            MaintenanceResponse(it, maintenanceService.getMonitors(it.id))
        }

    @Operation(
        summary = "Create maintenance",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_ADMIN",
    )
    @PreAuthorize("hasPermission(#dto.teamId, '$TEAM_ADMIN')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody @Valid dto: CreateMaintenanceDto): MaintenanceResponse =
        maintenanceService.create(dto).let {
            MaintenanceResponse(it, maintenanceService.getMonitors(it.id))
        }

    @Operation(
        summary = "Update maintenance",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $MAINTENANCE_ADMIN",
    )
    @PreAuthorize("hasPermission(#dto.id, '$MAINTENANCE_ADMIN')")
    @PutMapping
    @ResponseStatus(HttpStatus.OK)
    fun update(@RequestBody @Valid dto: UpdateMaintenanceDto): MaintenanceResponse =
        maintenanceService.update(dto).let {
            MaintenanceResponse(it, maintenanceService.getMonitors(it.id))
        }

    @Operation(
        summary = "Delete maintenance",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $MAINTENANCE_ADMIN",
    )
    @PreAuthorize("hasPermission(#publicId, '$MAINTENANCE_ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun delete(@PathVariable("id") publicId: String) {
        maintenanceService.delete(publicId)
    }
}
