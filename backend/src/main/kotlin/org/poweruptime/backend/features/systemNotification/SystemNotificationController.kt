package org.poweruptime.backend.features.systemNotification

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.REQUIRED_AUTH
import org.poweruptime.backend.core.SYSTEM_ROLE_ADMIN
import org.poweruptime.backend.features.systemNotification.dto.CreateSystemNotificationDto
import org.poweruptime.backend.features.systemNotification.dto.SystemNotificationResponse
import org.poweruptime.backend.features.systemNotification.dto.UpdateSystemNotificationDto
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/system-notification")
@Tag(name = "System Notification API")
class SystemNotificationController(
    private val systemNotificationService: SystemNotificationService
) {
    @Operation(
        summary = "Get all system tempNotification to be displayed",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @GetMapping("active")
    @ResponseStatus(HttpStatus.OK)
    fun getActive() = systemNotificationService.getActive().map { SystemNotificationResponse(it) }

    @Operation(
        summary = "Get all system tempNotification for editing",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('ADMIN')")
    fun getAll() = systemNotificationService.getAll().map { SystemNotificationResponse(it) }

    @Operation(
        summary = "Create system notification",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    fun create(@Valid @RequestBody dto: CreateSystemNotificationDto): SystemNotificationResponse =
        SystemNotificationResponse(systemNotificationService.create(dto))

    @Operation(
        summary = "Update system notification",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PutMapping
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('ADMIN')")
    fun update(@Valid @RequestBody dto: UpdateSystemNotificationDto): SystemNotificationResponse =
        SystemNotificationResponse(systemNotificationService.update(dto))

    @Operation(
        summary = "Delete system notification by id",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('ADMIN')")
    fun delete(@PathVariable("id") id: String): Unit = systemNotificationService.deleteByIdOrThrow(id)
}
