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
import org.poweruptime.backend.core.utils.DATETIME_FORMAT
import org.poweruptime.backend.features.authentication.domain.PermissionsService
import org.poweruptime.backend.features.authentication.domain.throwIfNotPartOf
import org.poweruptime.backend.features.authentication.permission.NOTIFICATION_MEMBER
import org.poweruptime.backend.features.authentication.permission.TEAM_MEMBER
import org.poweruptime.backend.features.authentication.service.userId
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.service.MonitorService
import org.poweruptime.backend.features.notification.dto.NotificationResponse
import org.poweruptime.backend.features.notification.service.NotificationService
import org.poweruptime.backend.features.team.service.TeamService
import org.springdoc.core.annotations.ParameterObject
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.time.ZonedDateTime

@RestController
@RequestMapping("/v1/notification")
@Tag(name = "Notification API")
class NotificationController(
    private val notificationService: NotificationService,
    private val monitorService: MonitorService,
    private val teamService: TeamService,
    private val permissionsService: PermissionsService,
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
        @ParameterObject pageable: Pageable,
        @RequestParam("monitorId") publicMonitorId: String?,
        @RequestParam("teamId") publicTeamId: String?,
        @RequestParam("statuses") statuses: List<MonitorStatus>?,
        @RequestParam("start") @DateTimeFormat(pattern = DATETIME_FORMAT) start: ZonedDateTime?,
        @RequestParam("end") @DateTimeFormat(pattern = DATETIME_FORMAT) end: ZonedDateTime?,
    ): PaginatedResponse<NotificationResponse> {
        if (publicMonitorId != null && publicTeamId != null) {
            throw BadRequestException("Monitor or Team id required")
        }

        publicMonitorId?.let { publicMonitorId ->
            auth.throwIfNotPartOf { publicUserId ->
                permissionsService.isPartOfByMonitorId(publicUserId, publicMonitorId)
            }
        }

        publicTeamId?.let { teamId ->
            auth.throwIfNotPartOf { publicUserId ->
                permissionsService.isPartOfByTeamId(publicUserId, teamId)
            }
        }

        return notificationService.getAllPaginated(
            pageable = pageable,
            monitorId = publicMonitorId?.let { monitorService.getIdByPublicId(it) },
            teamId = publicTeamId?.let { teamService.getIdByPublicId(it) },
            userId = if (publicTeamId == null && publicMonitorId == null) auth.userId() else null,
            statuses = statuses,
            start = start?.toInstant(),
            end = end?.plusDays(1)?.toInstant(),
        ).toDto {
            NotificationResponse(it)
        }
    }

    @Operation(
        summary = "Get notification",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_MEMBER",
    )
    @PreAuthorize("hasPermission(#publicId, '$NOTIFICATION_MEMBER')")
    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun get(
        @PathVariable("id") publicId: String
    ): NotificationResponse = NotificationResponse(
        notificationService.getByIdJoinMonitorAndTeam(notificationService.getIdByPublicId(publicId)),
    )
}
