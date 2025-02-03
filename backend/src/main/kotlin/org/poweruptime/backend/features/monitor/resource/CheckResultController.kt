package org.poweruptime.backend.features.monitor.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.REQUIRED_AUTH
import org.poweruptime.backend.core.SYSTEM_ROLE_ADMIN
import org.poweruptime.backend.core.dto.PaginatedResponse
import org.poweruptime.backend.core.dto.toDto
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.features.authentication.domain.PermissionRepository
import org.poweruptime.backend.features.authentication.domain.throwIfNotPartOf
import org.poweruptime.backend.features.authentication.permission.CHECK_RESULT_MEMBER
import org.poweruptime.backend.features.authentication.permission.TEAM_MEMBER
import org.poweruptime.backend.features.authentication.service.AuthService
import org.poweruptime.backend.features.monitor.dto.CheckResultResponse
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.service.CheckResultService
import org.springdoc.core.annotations.ParameterObject
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/check-result")
@Tag(name = "Check Result API")
class CheckResultController(
    private val checkResultService: CheckResultService,
    private val authService: AuthService,
    private val permissionRepository: PermissionRepository
) {
    @Operation(
        summary = "Get check results",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_MEMBER",
    )
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    fun getAll(
        auth: Authentication,
        @ParameterObject @PageableDefault pageable: Pageable,
        @RequestParam("monitorId") monitorId: String?,
        @RequestParam("teamId") teamId: String?,
        @RequestParam("onlyChanges") onlyChanges: Boolean = false,
        @RequestParam("statuses") statuses: List<MonitorStatus>?,
    ): PaginatedResponse<CheckResultResponse> {
        if (monitorId != null && teamId != null) {
            throw BadRequestException("Monitor or Team id required")
        }

        val user = authService.getByAuthOrThrow(auth)

        monitorId?.let {
            user.throwIfNotPartOf {
                permissionRepository.isPartOfByMonitorId(user.id, it)
            }
        }

        teamId?.let {
            user.throwIfNotPartOf {
                permissionRepository.isPartOfByTeamId(user.id, it)
            }
        }

        return checkResultService.getAllPaginated(
            pageable = pageable,
            monitorId = monitorId,
            teamId = teamId,
            userId = if (teamId == null && monitorId == null) user.id else null,
            statuses = statuses,
            onlyChanges = onlyChanges,
        ).toDto {
            CheckResultResponse(it)
        }
    }

    @Operation(
        summary = "Get check result",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_MEMBER",
    )
    @PreAuthorize("hasPermission(#id, '$CHECK_RESULT_MEMBER')")
    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun get(@PathVariable id: String): CheckResultResponse = CheckResultResponse(checkResultService.getByIdOrThrow(id))
}
