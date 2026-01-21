package org.poweruptime.backend.features.notification.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.REQUIRED_AUTH
import org.poweruptime.backend.core.SYSTEM_ROLE_ADMIN
import org.poweruptime.backend.core.SYSTEM_ROLE_USER
import org.poweruptime.backend.core.dto.CloneDto
import org.poweruptime.backend.core.dto.Pageable
import org.poweruptime.backend.core.dto.PaginatedResponse
import org.poweruptime.backend.core.dto.toDto
import org.poweruptime.backend.features.authentication.permission.*
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.service.MonitorService
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.dto.CreateNotificationMethodDto
import org.poweruptime.backend.features.notification.dto.NotificationMethodResponse
import org.poweruptime.backend.features.notification.dto.NotificationMethodTemplateResponse
import org.poweruptime.backend.features.notification.dto.UpdateNotificationMethodDto
import org.poweruptime.backend.features.notification.model.NotificationMethodData
import org.poweruptime.backend.features.notification.model.NotificationMethodRecord
import org.poweruptime.backend.features.notification.model.NotificationMethodWithDataRecord
import org.poweruptime.backend.features.notification.service.NotificationMethodDataService
import org.poweruptime.backend.features.notification.service.NotificationMethodService
import org.poweruptime.backend.features.team.service.TeamService
import org.springdoc.core.annotations.ParameterObject
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/notification-method")
@Tag(name = "Notification Method API")
class NotificationMethodController(
    private val notificationMethodService: NotificationMethodService,
    private val notificationMethodDataService: NotificationMethodDataService,
    private val teamService: TeamService,
    private val monitorService: MonitorService,
) {
    @Operation(
        summary = "Get notification method",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $NOTIFICATION_METHOD_MEMBER",
    )
    @PreAuthorize("hasPermission(#id, '$NOTIFICATION_METHOD_MEMBER')")
    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun get(@PathVariable id: String): NotificationMethodResponse =
        notificationMethodService.getById(notificationMethodService.getIdByPublicId(id)).toResponse()

    @Operation(
        summary = "Get notification method template settings",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_USER",
    )
    @GetMapping("/template/{type}")
    @ResponseStatus(HttpStatus.OK)
    fun getTemplate(@PathVariable type: NotificationMethodType) = NotificationMethodTemplateResponse(type)

    @Operation(
        summary = "Get notification methods",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_MEMBER",
    )
    @PreAuthorize("hasPermission(#publicTeamId, '$TEAM_MEMBER')")
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    fun getAll(
        @ParameterObject pageable: Pageable,
        @RequestParam("teamId") publicTeamId: String,
        @RequestParam("name") name: String?,
        @RequestParam("types") types: List<NotificationMethodType>?,
        @RequestParam("useByDefault") useByDefault: Boolean?,
        @RequestParam("deleted") deleted: Boolean = false,
    ): PaginatedResponse<NotificationMethodResponse> {
        val notificationMethods = notificationMethodService.getAllPaginated(
            pageable = pageable,
            name = name,
            teamId = teamService.getIdByPublicId(publicTeamId),
            types = types,
            useByDefault = useByDefault,
            deleted = deleted,
        )

        val notificationMethodIds = notificationMethods.map { it.id }.content

        val monitorsPerNotificationMethodId = monitorService.getByNotificationMethodId(notificationMethodIds)

        return notificationMethods.toDto {
            it.toResponse(
                usedByMonitors = monitorsPerNotificationMethodId[it.id].orEmpty(),
            )
        }
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
        notificationMethodService.create(dto).toResponse()

    @Operation(
        summary = "Update notification method",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $NOTIFICATION_METHOD_ADMIN",
    )
    @PreAuthorize("hasPermission(#dto.id, '$NOTIFICATION_METHOD_ADMIN')")
    @PutMapping
    @ResponseStatus(HttpStatus.OK)
    fun update(@RequestBody @Valid dto: UpdateNotificationMethodDto): NotificationMethodResponse =
        notificationMethodService.update(dto).toResponse()

    @Operation(
        summary = "Clone a notification method with connected monitors and tags",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $NOTIFICATION_METHOD_ADMIN",
    )
    @PreAuthorize("hasPermission(#publicId, '$NOTIFICATION_METHOD_ADMIN')")
    @PutMapping("/{id}/clone")
    @ResponseStatus(HttpStatus.OK)
    fun clone(
        @PathVariable(
            "id",
        ) publicId: String,
        @RequestBody @Valid cloneDto: CloneDto,
    ): NotificationMethodResponse = notificationMethodService
        .clone(
            publicId,
            cloneDto.teamId?.let { teamService.getIdByPublicId(it) },
        ).toResponse()

    @Operation(
        summary = "Delete notification method",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $NOTIFICATION_METHOD_ADMIN",
    )
    @PreAuthorize("hasPermission(#publicId, '$NOTIFICATION_METHOD_ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun delete(@PathVariable("id") publicId: String) {
        notificationMethodService.deleteById(notificationMethodService.getIdByPublicId(publicId))
    }

    @Operation(
        summary = "Undelete notification method",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $NOTIFICATION_METHOD_ADMIN",
    )
    @PreAuthorize("hasPermission(#publicId, '$NOTIFICATION_METHOD_ADMIN')")
    @DeleteMapping("/{id}/undo")
    @ResponseStatus(HttpStatus.OK)
    fun undelete(@PathVariable("id") publicId: String): NotificationMethodResponse = notificationMethodService
        .undeleteById(
            notificationMethodService.getIdByPublicId(publicId, includeDeleted = true),
        ).toResponse()

    private fun NotificationMethodWithDataRecord.toResponse(
        usedByMonitors: List<MonitorRecord> = monitorService.getByNotificationMethodId(notificationMethod.id),
    ) = NotificationMethodResponse(
        notificationMethod = notificationMethod,
        data = data,
        usedByMonitors = usedByMonitors,
    )

    private fun NotificationMethodRecord.toResponse(
        data: NotificationMethodData = notificationMethodDataService.findByIdAndType(this.id, this.type),
        usedByMonitors: List<MonitorRecord> = monitorService.getByNotificationMethodId(this.id),
    ) = NotificationMethodResponse(
        notificationMethod = this,
        data = data,
        usedByMonitors = usedByMonitors,
    )
}
