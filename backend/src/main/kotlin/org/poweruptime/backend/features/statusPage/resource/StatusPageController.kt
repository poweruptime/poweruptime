package org.poweruptime.backend.features.statusPage.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.REQUIRED_AUTH
import org.poweruptime.backend.core.SYSTEM_ROLE_ADMIN
import org.poweruptime.backend.core.dto.PaginatedResponse
import org.poweruptime.backend.core.dto.toDto
import org.poweruptime.backend.features.authentication.permission.STATUS_PAGE_ADMIN
import org.poweruptime.backend.features.authentication.permission.STATUS_PAGE_MEMBER
import org.poweruptime.backend.features.authentication.permission.TEAM_ADMIN
import org.poweruptime.backend.features.authentication.permission.TEAM_MEMBER
import org.poweruptime.backend.features.statusPage.domain.StatusPageGroupMonitorRepository
import org.poweruptime.backend.features.statusPage.dto.CreateStatusPageDto
import org.poweruptime.backend.features.statusPage.dto.StatusPageResponse
import org.poweruptime.backend.features.statusPage.dto.UpdateStatusPageDto
import org.poweruptime.backend.features.statusPage.model.StatusPage
import org.poweruptime.backend.features.statusPage.service.StatusPageService
import org.springdoc.core.annotations.ParameterObject
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/status-page")
@Tag(name = "Status Page API")
class StatusPageController(
    private val statusPageService: StatusPageService,
    private val statusPageGroupMonitorRepository: StatusPageGroupMonitorRepository,
) {
    @Operation(
        summary = "Get status page",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $STATUS_PAGE_MEMBER",
    )
    @PreAuthorize("hasPermission(#id, '$STATUS_PAGE_MEMBER')")
    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun get(@PathVariable id: String): StatusPageResponse = statusPageService.getByIdOrThrow(id).toResponse()

    @Operation(
        summary = "Get all status pages of team",
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
        @RequestParam("deleted") deleted: Boolean = false,
    ): PaginatedResponse<StatusPageResponse> {
        return statusPageService.getAllPaginated(
            pageable = pageable,
            teamId = teamId,
            name = name,
            deleted = deleted,
        ).toDto { it.toResponse() }
    }

    data class BooleanResponse(val it: Boolean)

    @Operation(
        summary = "Check if slug is free",
        security = [SecurityRequirement(name = BEARER_AUTH)],
    )
    @GetMapping("/free/{slug}")
    @ResponseStatus(HttpStatus.OK)
    fun freeSlug(@PathVariable slug: String): BooleanResponse = BooleanResponse(
        statusPageService.getBySlug(slug) == null,
    )

    @Operation(
        summary = "Add status page",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_ADMIN",
    )
    @PreAuthorize("hasPermission(#dto.teamId, '$TEAM_ADMIN')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @RequestBody @Valid dto: CreateStatusPageDto
    ): StatusPageResponse = statusPageService.create(dto).toResponse()

    @Operation(
        summary = "Update status page",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $STATUS_PAGE_ADMIN",
    )
    @PreAuthorize("hasPermission(#dto.id, '$STATUS_PAGE_ADMIN')")
    @PutMapping
    @ResponseStatus(HttpStatus.OK)
    fun update(@RequestBody @Valid dto: UpdateStatusPageDto): StatusPageResponse =
        statusPageService.update(dto).toResponse()

    @Operation(
        summary = "Delete status page",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $STATUS_PAGE_ADMIN",
    )
    @PreAuthorize("hasPermission(#id, '$STATUS_PAGE_ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun delete(@PathVariable("id") id: String): Unit = statusPageService.deleteByIdOrThrow(id)

    @Operation(
        summary = "Undelete status page",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $STATUS_PAGE_ADMIN",
    )
    @PreAuthorize("hasPermission(#id, '$STATUS_PAGE_ADMIN')")
    @DeleteMapping("/{id}/undo")
    @ResponseStatus(HttpStatus.OK)
    fun undelete(@PathVariable("id") id: String): StatusPageResponse =
        statusPageService.undeleteById(id).toResponse()

    private fun StatusPage.toResponse(): StatusPageResponse = StatusPageResponse(
        statusPage = this,
        statusPageGroupMonitors = statusPageGroupMonitorRepository
            .findByStatusPage(this.id)
            .groupBy { it.connection.group.id },
    )
}
