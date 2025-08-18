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
import org.poweruptime.backend.features.authentication.permission.NOTIFICATION_MEMBER
import org.poweruptime.backend.features.authentication.permission.TEAM_MEMBER
import org.poweruptime.backend.features.authentication.service.userId
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.dto.NotificationResponse
import org.poweruptime.backend.features.notification.service.NotificationService
import org.springdoc.core.annotations.ParameterObject
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/notification")
@Tag(name = "Notification API")
class NotificationController(
    val notificationService: NotificationService,
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
        @RequestParam("methods") methods: List<NotificationMethodType>?,
        @RequestParam("statuses") statuses: List<MonitorStatus>?,
    ): PaginatedResponse<NotificationResponse> {
        if (monitorId != null && teamId != null) {
            throw BadRequestException("Monitor or Team id required")
        }

        monitorId?.let { monitorId ->
            auth.throwIfNotPartOf { userId ->
                permissionRepository.isPartOfByMonitorId(userId, monitorId)
            }
        }

        teamId?.let { teamId ->
            auth.throwIfNotPartOf { userId ->
                permissionRepository.isPartOfByTeamId(userId, teamId)
            }
        }

        return notificationService.getAllPaginated(
            pageable = pageable,
            monitorId = monitorId,
            teamId = teamId,
            userId = if (teamId == null && monitorId == null) auth.userId() else null,
            methods = methods,
            statuses = statuses,
        ).toDto {
            NotificationResponse(it)
        }
    }

    @Operation(
        summary = "Get notification",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_MEMBER",
    )
    @PreAuthorize("hasPermission(#id, '$NOTIFICATION_MEMBER')")
    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun get(
        @PathVariable id: String
    ): NotificationResponse = NotificationResponse(notificationService.getByIdOrThrow(id))
}
