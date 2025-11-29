package org.poweruptime.backend.features.notification.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.REQUIRED_AUTH
import org.poweruptime.backend.core.SYSTEM_ROLE_ADMIN
import org.poweruptime.backend.core.dto.Pageable
import org.poweruptime.backend.core.dto.PaginatedResponse
import org.poweruptime.backend.core.dto.toDto
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.features.authentication.domain.PermissionsService
import org.poweruptime.backend.features.authentication.domain.throwIfNotPartOf
import org.poweruptime.backend.features.authentication.permission.TEAM_MEMBER
import org.poweruptime.backend.features.authentication.service.userId
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.service.MonitorService
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.dto.SubNotificationResponse
import org.poweruptime.backend.features.notification.service.NotificationService
import org.poweruptime.backend.features.notification.service.SubNotificationService
import org.poweruptime.backend.features.team.service.TeamService
import org.springdoc.core.annotations.ParameterObject
import org.springframework.http.HttpStatus
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/sub-notification")
@Tag(name = "Sub Notification API")
class SubNotificationController(
    private val subNotificationService: SubNotificationService,
    private val notificationService: NotificationService,
    private val monitorService: MonitorService,
    private val teamService: TeamService,
    private val permissionsService: PermissionsService,
) {
    @Operation(
        summary = "Get sub notifications",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_MEMBER",
    )
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    fun getAll(
        auth: Authentication,
        @ParameterObject pageable: Pageable,
        @RequestParam("notificationId") publicNotificationId: String?,
        @RequestParam("monitorId") publicMonitorId: String?,
        @RequestParam("teamId") publicTeamId: String?,
        @RequestParam("methods") methods: List<NotificationMethodType>?,
        @RequestParam("statuses") statuses: List<MonitorStatus>?,
    ): PaginatedResponse<SubNotificationResponse> {
        if (publicMonitorId != null && publicTeamId != null) {
            throw BadRequestException("Monitor or Team id required")
        }

        publicMonitorId?.let { publicMonitorId ->
            auth.throwIfNotPartOf { publicUserId ->
                permissionsService.isPartOfByMonitorId(publicUserId, publicMonitorId)
            }
        }

        publicTeamId?.let { publicTeamId ->
            auth.throwIfNotPartOf { publicUserId ->
                permissionsService.isPartOfByTeamId(publicUserId, publicTeamId)
            }
        }

        publicNotificationId?.let { notificationId ->
            auth.throwIfNotPartOf { userId ->
                permissionsService.isPartOfByNotificationId(userId, notificationId)
            }
        }

        return subNotificationService.getAllPaginated(
            pageable = pageable,
            notificationId = publicNotificationId?.let { notificationService.getIdByPublicId(it) },
            monitorId = publicMonitorId?.let { monitorService.getIdByPublicId(it) },
            teamId = publicTeamId?.let { teamService.getIdByPublicId(it) },
            userId = if (publicTeamId == null && publicMonitorId == null && publicNotificationId == null) {
                auth.userId()
            } else {
                null
            },
            methods = methods,
            statuses = statuses,
        ).toDto {
            SubNotificationResponse(it)
        }
    }
}
