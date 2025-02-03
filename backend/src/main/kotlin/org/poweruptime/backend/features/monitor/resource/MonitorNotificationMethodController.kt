package org.poweruptime.backend.features.monitor.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.REQUIRED_AUTH
import org.poweruptime.backend.core.SYSTEM_ROLE_ADMIN
import org.poweruptime.backend.features.authentication.permission.MONITOR_ADMIN
import org.poweruptime.backend.features.authentication.permission.MONITOR_MEMBER
import org.poweruptime.backend.features.authentication.permission.TEAM_MEMBER
import org.poweruptime.backend.features.monitor.dto.SetMonitorNotificationMethodsDto
import org.poweruptime.backend.features.monitor.service.MonitorService
import org.poweruptime.backend.features.notification.dto.NotificationMethodMinResponse
import org.poweruptime.backend.features.notification.service.NotificationMethodService
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/monitor/{id}/notification-method")
@Tag(name = "Monitor Notification Method API")
class MonitorNotificationMethodController(
    private val monitorService: MonitorService,
    private val notificationMethodService: NotificationMethodService,
) {
    @Operation(
        summary = "Get monitor's notification methods",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_MEMBER",
    )
    @PreAuthorize("hasPermission(#monitorId, '$MONITOR_MEMBER')")
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    fun getAll(
        @PathVariable("id") monitorId: String
    ): List<NotificationMethodMinResponse> = notificationMethodService.getByMonitorId(
        monitorId,
    ).map { NotificationMethodMinResponse(it) }

    @Operation(
        summary = "Set notification methods of monitor",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $MONITOR_ADMIN",
    )
    @PreAuthorize("hasPermission(#monitorId, '$MONITOR_ADMIN')")
    @PutMapping
    @ResponseStatus(HttpStatus.OK)
    fun set(@PathVariable("id") monitorId: String, @RequestBody @Valid dto: SetMonitorNotificationMethodsDto) {
        val monitor = monitorService.getByIdOrThrow(monitorId)
        val notificationMethods = notificationMethodService.getByIdOrThrow(dto.ids)
        notificationMethodService.ensureAllNotificationMethodsInTeam(
            teamId = monitor.team.id,
            notificationMethods = notificationMethods,
        )
        monitorService.setEnabledNotificationMethods(monitor, notificationMethods)
    }
}
