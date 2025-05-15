package org.poweruptime.backend.features.notification.resource

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
import org.poweruptime.backend.features.authentication.permission.TEAM_MEMBER
import org.poweruptime.backend.features.authentication.service.AuthService
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.notification.core.NotificationMethodDataType
import org.poweruptime.backend.features.notification.dto.NotificationResponse
import org.poweruptime.backend.features.notification.service.NotificationService
import org.springdoc.core.annotations.ParameterObject
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/notification")
@Tag(name = "Notification API")
class NotificationController(
    val notificationService: NotificationService,
    val authService: AuthService,
    val permissionRepository: PermissionRepository
) {
    @Operation(
        summary = "Get notifications",
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
        @RequestParam("methods") methods: List<NotificationMethodDataType>?,
        @RequestParam("statuses") statuses: List<MonitorStatus>?,
    ): PaginatedResponse<NotificationResponse> {
        if (monitorId != null && teamId != null) {
            throw BadRequestException("Monitor or Team id required")
        }

        val user = authService.getByAuthOrThrow(auth)

        monitorId?.let { monitorId ->
            user.throwIfNotPartOf {
                permissionRepository.isPartOfByMonitorId(user.id, monitorId)
            }
        }

        teamId?.let { teamId ->
            user.throwIfNotPartOf {
                permissionRepository.isPartOfByTeamId(user.id, teamId)
            }
        }

        return notificationService.getAllPaginated(
            pageable = pageable,
            monitorId = monitorId,
            teamId = teamId,
            userId = if (teamId == null && monitorId == null) user.id else null,
            methods = methods,
            statuses = statuses,
        ).toDto {
            NotificationResponse(it)
        }
    }
}
