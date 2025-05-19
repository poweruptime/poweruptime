package org.poweruptime.backend.features.notification.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.REQUIRED_AUTH
import org.poweruptime.backend.core.SYSTEM_ROLE_ADMIN
import org.poweruptime.backend.core.dto.PaginatedResponse
import org.poweruptime.backend.core.dto.toDto
import org.poweruptime.backend.features.authentication.permission.*
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.dto.CreateNotificationMethodDto
import org.poweruptime.backend.features.notification.dto.NotificationMethodResponse
import org.poweruptime.backend.features.notification.dto.UpdateNotificationMethodDto
import org.poweruptime.backend.features.notification.service.NotificationMethodService
import org.springdoc.core.annotations.ParameterObject
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/notification-method")
@Tag(name = "Notification Method API")
class NotificationMethodController(
    private val notificationMethodService: NotificationMethodService,
) {
    @Operation(
        summary = "Get notification method",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $NOTIFICATION_METHOD_MEMBER",
    )
    @PreAuthorize("hasPermission(#id, '$NOTIFICATION_METHOD_MEMBER')")
    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun get(@PathVariable id: String) = NotificationMethodResponse(
        notificationMethodService.getByIdOrThrow(id),
    )

    @Operation(
        summary = "Get notification methods",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_MEMBER",
    )
    @PreAuthorize("hasPermission(#teamId, '$TEAM_MEMBER')")
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    fun getAll(
        @ParameterObject @PageableDefault pageable: Pageable,
        @RequestParam("teamId") teamId: String,
        @RequestParam("name") name: String?,
        @RequestParam("types") types: List<NotificationMethodType>?,
        @RequestParam("useByDefault") useByDefault: Boolean?,
        @RequestParam("deleted") deleted: Boolean = false,
    ): PaginatedResponse<NotificationMethodResponse> = notificationMethodService.getAllPaginated(
        pageable = pageable,
        name = name,
        teamId = teamId,
        types = types,
        useByDefault = useByDefault,
        deleted = deleted,
    ).toDto {
        NotificationMethodResponse(it)
    }

    @Operation(
        summary = "Add notification method",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_ADMIN",
    )
    @PreAuthorize("hasPermission(#dto.teamId, '$TEAM_ADMIN')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody @Valid dto: CreateNotificationMethodDto): NotificationMethodResponse =
        NotificationMethodResponse(notificationMethodService.create(dto))

    @Operation(
        summary = "Update notification method",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $NOTIFICATION_METHOD_ADMIN",
    )
    @PreAuthorize("hasPermission(#dto.id, '$NOTIFICATION_METHOD_ADMIN')")
    @PutMapping
    @ResponseStatus(HttpStatus.OK)
    fun update(@RequestBody @Valid dto: UpdateNotificationMethodDto): NotificationMethodResponse =
        NotificationMethodResponse(notificationMethodService.update(dto))

    @Operation(
        summary = "Delete notification method",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $NOTIFICATION_METHOD_ADMIN",
    )
    @PreAuthorize("hasPermission(#id, '$NOTIFICATION_METHOD_ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun delete(@PathVariable("id") id: String): Unit = notificationMethodService.deleteByIdOrThrow(id)

    @Operation(
        summary = "Undelete notification method",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $NOTIFICATION_METHOD_ADMIN",
    )
    @PreAuthorize("hasPermission(#id, '$NOTIFICATION_METHOD_ADMIN')")
    @DeleteMapping("/{id}/undo")
    @ResponseStatus(HttpStatus.OK)
    fun undelete(@PathVariable("id") id: String): NotificationMethodResponse =
        NotificationMethodResponse(notificationMethodService.undeleteById(id))
}
