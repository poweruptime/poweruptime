package org.poweruptime.backend.features.statusPage.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.REQUIRED_AUTH
import org.poweruptime.backend.core.SYSTEM_ROLE_ADMIN
import org.poweruptime.backend.core.dto.BooleanResponse
import org.poweruptime.backend.core.dto.PaginatedResponse
import org.poweruptime.backend.core.dto.toDto
import org.poweruptime.backend.features.authentication.permission.STATUS_PAGE_ADMIN
import org.poweruptime.backend.features.authentication.permission.STATUS_PAGE_MEMBER
import org.poweruptime.backend.features.authentication.permission.TEAM_ADMIN
import org.poweruptime.backend.features.authentication.permission.TEAM_MEMBER
import org.poweruptime.backend.features.statusPage.domain.findByStatusPage
import org.poweruptime.backend.features.statusPage.dto.CreateStatusPageDto
import org.poweruptime.backend.features.statusPage.dto.StatusPageResponse
import org.poweruptime.backend.features.statusPage.dto.UpdateStatusPageDto
import org.poweruptime.backend.features.statusPage.model.StatusPageDomainNameRecord
import org.poweruptime.backend.features.statusPage.model.StatusPageDomainNameTable
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupMonitorJoinMonitorRecord
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupMonitorTable
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupRecord
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupTable
import org.poweruptime.backend.features.statusPage.model.StatusPageRecord
import org.poweruptime.backend.features.statusPage.service.StatusPageService
import org.poweruptime.backend.features.team.service.TeamService
import org.springdoc.core.annotations.ParameterObject
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/status-page")
@Tag(name = "Status Page API")
@Transactional(readOnly = true)
class StatusPageController(
    private val statusPageService: StatusPageService,
    private val teamService: TeamService
) {
    @Operation(
        summary = "Get status page",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $STATUS_PAGE_MEMBER",
    )
    @PreAuthorize("hasPermission(#publicId, '$STATUS_PAGE_MEMBER')")
    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun get(@PathVariable("id") publicId: String): StatusPageResponse =
        statusPageService.getById(statusPageService.getIdByPublicId(publicId)).toResponse()

    @Operation(
        summary = "Get all status pages of team",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_MEMBER",
    )
    @PreAuthorize("hasPermission(#publicTeamId, '$TEAM_MEMBER')")
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    @Transactional(readOnly = true)
    fun getAll(
        @ParameterObject @PageableDefault pageable: Pageable,
        @RequestParam("teamId") publicTeamId: String,
        @RequestParam("name") name: String?,
        @RequestParam("deleted") deleted: Boolean = false,
    ): PaginatedResponse<StatusPageResponse> {
        val statusPages = statusPageService.getAllPaginated(
            pageable = pageable,
            teamId = teamService.getIdByPublicId(publicTeamId),
            name = name,
            deleted = deleted,
        )

        val statusPageIds = statusPages.map { it.id }.toList()

        val domainNamesPerStatusPage =
            StatusPageDomainNameTable.findByStatusPage(statusPageIds).groupBy { it.statusPageId }
        val groupsPerStatusPage =
            StatusPageGroupTable.findByStatusPage(statusPageIds).groupBy { it.statusPageId }
        val groupMonitorsPerStatusPage =
            StatusPageGroupMonitorTable.findByStatusPage(statusPageIds).groupBy { it.groupMonitor.statusPageId }

        return statusPages.toDto {
            it.toResponse(
                domainNames = domainNamesPerStatusPage[it.id] ?: emptyList(),
                groups = groupsPerStatusPage[it.id] ?: emptyList(),
                statusPageGroupMonitors = groupMonitorsPerStatusPage[it.id] ?: emptyList(),
            )
        }
    }

    @Operation(
        summary = "Check if slug is free",
        security = [SecurityRequirement(name = BEARER_AUTH)],
    )
    @GetMapping("/free/slug/{slug}")
    @ResponseStatus(HttpStatus.OK)
    fun freeSlug(@PathVariable slug: String): BooleanResponse = BooleanResponse(
        statusPageService.findBySlug(slug) == null,
    )

    @Operation(
        summary = "Check if domain names are free",
        security = [SecurityRequirement(name = BEARER_AUTH)],
    )
    @GetMapping("/free/domain/{domainNames}")
    @ResponseStatus(HttpStatus.OK)
    fun freeDomainNames(
        @PathVariable domainNames: String
    ): List<BooleanResponse> = domainNames.split(
        ",",
    ).map { BooleanResponse(statusPageService.findByDomainName(it) == null) }

    @Operation(
        summary = "Add status page",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_ADMIN",
    )
    @PreAuthorize("hasPermission(#dto.teamId, '$TEAM_ADMIN')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    fun create(
        @RequestBody @Valid dto: CreateStatusPageDto
    ): StatusPageResponse = statusPageService.create(dto).toResponse()

    @Operation(
        summary = "Update status page",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $STATUS_PAGE_ADMIN",
    )
    @PreAuthorize("hasPermission(#dto.slug, '$STATUS_PAGE_ADMIN')")
    @PutMapping
    @ResponseStatus(HttpStatus.OK)
    @Transactional
    fun update(@RequestBody @Valid dto: UpdateStatusPageDto): StatusPageResponse =
        statusPageService.update(dto).toResponse()

    @Operation(
        summary = "Delete status page",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $STATUS_PAGE_ADMIN",
    )
    @PreAuthorize("hasPermission(#publicId, '$STATUS_PAGE_ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    @Transactional
    fun delete(@PathVariable("id") publicId: String) {
        statusPageService.deleteById(statusPageService.getIdByPublicId(publicId))
    }

    @Operation(
        summary = "Undelete status page",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $STATUS_PAGE_ADMIN",
    )
    @PreAuthorize("hasPermission(#publicId, '$STATUS_PAGE_ADMIN')")
    @DeleteMapping("/{id}/undo")
    @ResponseStatus(HttpStatus.OK)
    @Transactional
    fun undelete(@PathVariable("id") publicId: String): StatusPageResponse =
        statusPageService.undeleteById(
            statusPageService.getIdByPublicId(publicId, includeDeleted = true),
        ).toResponse()

    private fun StatusPageRecord.toResponse(
        domainNames: List<StatusPageDomainNameRecord> = StatusPageDomainNameTable.findByStatusPage(this.id),
        groups: List<StatusPageGroupRecord> = StatusPageGroupTable.findByStatusPage(this.id),
        statusPageGroupMonitors: List<StatusPageGroupMonitorJoinMonitorRecord> = StatusPageGroupMonitorTable
            .findByStatusPage(this.id)
    ): StatusPageResponse = StatusPageResponse(
        statusPage = this,
        domainNames = domainNames,
        groups = groups,
        statusPageGroupMonitors = statusPageGroupMonitors.groupBy { it.groupMonitor.groupId },
    )
}
