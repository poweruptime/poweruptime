package org.poweruptime.backend.features.monitor.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.REQUIRED_AUTH
import org.poweruptime.backend.core.SYSTEM_ROLE_ADMIN
import org.poweruptime.backend.core.dto.CloneDto
import org.poweruptime.backend.core.dto.PaginatedResponse
import org.poweruptime.backend.core.dto.toDto
import org.poweruptime.backend.core.exceptions.ForbiddenException
import org.poweruptime.backend.features.authentication.domain.PermissionRepository
import org.poweruptime.backend.features.authentication.domain.ensureAllInTeam
import org.poweruptime.backend.features.authentication.domain.isPartOfByNotificationMethodIds
import org.poweruptime.backend.features.authentication.domain.isPartOfByStatusPageGroupIds
import org.poweruptime.backend.features.authentication.domain.throwIfNotPartOf
import org.poweruptime.backend.features.authentication.permission.*
import org.poweruptime.backend.features.authentication.service.AuthService
import org.poweruptime.backend.features.monitor.core.TimeOption
import org.poweruptime.backend.features.monitor.dto.*
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.MonitorType
import org.poweruptime.backend.features.monitor.service.CheckResultService
import org.poweruptime.backend.features.monitor.service.MonitorService
import org.poweruptime.backend.features.monitor.service.myFormat
import org.poweruptime.backend.features.notification.service.NotificationMethodService
import org.poweruptime.backend.features.statusPage.service.StatusPageGroupService
import org.springdoc.core.annotations.ParameterObject
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

const val LAST_CHECK_RESULTS_COUNT = 22

@RestController
@RequestMapping("/v1/monitor")
@Tag(name = "Monitor API")
class MonitorController(
    private val monitorService: MonitorService,
    private val notificationMethodService: NotificationMethodService,
    private val statusPageGroupService: StatusPageGroupService,
    private val checkResultService: CheckResultService,
    private val authService: AuthService,
    private val permissionRepository: PermissionRepository
) {
    @Operation(
        summary = "Get monitor",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_MEMBER",
    )
    @PreAuthorize("hasPermission(#id, '$MONITOR_MEMBER')")
    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun get(@PathVariable id: String): MonitorMaxResponse = monitorService.getByIdOrThrow(id).toMaxResponse()

    @Operation(
        summary = "Get all monitors",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_MEMBER",
    )
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    fun getAll(
        authentication: Authentication,
        @ParameterObject @PageableDefault pageable: Pageable,
        @RequestParam("teamId") teamId: String?,
        @RequestParam("name") name: String?,
        @RequestParam("enabledNotificationMethodIds") enabledNotificationMethodIds: Set<String>?,
        @RequestParam("statuses") statuses: List<MonitorStatus>?,
        @RequestParam("types") types: List<MonitorType>?,
        @RequestParam("tags") tags: List<String>?,
        @RequestParam("usedInStatusPageGroupIds") usedInStatusPageGroupIds: Set<String>?,
        @RequestParam("deleted") deleted: Boolean = false
    ): PaginatedResponse<MonitorResponse> {
        val user = authService.getByAuthOrThrow(authentication)

        teamId?.let {
            user.throwIfNotPartOf { user ->
                permissionRepository.isPartOfByTeamId(user.id, it)
            }
        }

        val monitors = monitorService.getAllPaginated(
            pageable = pageable,
            teamId = teamId,
            userId = if (teamId == null) user.id else null,
            statuses = statuses,
            types = types,
            name = name,
            tags = tags,
            enabledNotificationMethodIds = enabledNotificationMethodIds?.apply {
                if (teamId != null) {
                    notificationMethodService.getById(this).ensureAllInTeam(teamId) { it.team.id }
                } else {
                    permissionRepository.isPartOfByNotificationMethodIds(user.id, this)
                }
            }?.toList(),
            usedInStatusPageGroupIds = usedInStatusPageGroupIds?.apply {
                if (teamId != null) {
                    if (!statusPageGroupService.ensureAllStatusGroupsInTeam(
                            statusPageGroupService.getById(this),
                            teamId,
                        )
                    ) {
                        throw ForbiddenException("Can only check for status page groups in same team")
                    }
                } else {
                    permissionRepository.isPartOfByStatusPageGroupIds(user.id, this)
                }
            }?.toList(),
            deleted = deleted,
        )
        val checkResultsPerMonitor = checkResultService.getLastByMonitorIds(
            monitors.toList().map {
                it.id
            },
            LAST_CHECK_RESULTS_COUNT,
        )

        return monitors.toDto {
            MonitorResponse(
                it,
                lastCheckResults = checkResultsPerMonitor[it.id] ?: emptyList(),
                oneDayUptime = checkResultService.calculateRecentUptimeByMonitorId(
                    it.id,
                    TimeOption.ONE_DAY,
                ).myFormat(),
            )
        }
    }

    @Operation(
        summary = "Add monitor",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_ADMIN",
    )
    @PreAuthorize("hasPermission(#dto.teamId, '$TEAM_ADMIN')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody @Valid dto: CreateMonitorDto): MonitorFullResponse =
        monitorService.create(dto).toFullResponse()

    @Operation(
        summary = "Update monitor",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $MONITOR_ADMIN",
    )
    @PreAuthorize("hasPermission(#dto.id, '$MONITOR_ADMIN')")
    @PutMapping
    @ResponseStatus(HttpStatus.OK)
    fun update(@RequestBody @Valid dto: UpdateMonitorDto): MonitorFullResponse =
        monitorService.update(dto).toFullResponse()

    @Operation(
        summary = "Clone a monitor with notification methods and tags",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $MONITOR_ADMIN",
    )
    @PreAuthorize("hasPermission(#id, '$MONITOR_ADMIN')")
    @PutMapping("/{id}/clone")
    @ResponseStatus(HttpStatus.OK)
    fun clone(@PathVariable("id") id: String, @RequestBody @Valid cloneDto: CloneDto): MonitorFullResponse =
        monitorService.clone(monitorService.getByIdOrThrow(id), cloneDto.teamId).toFullResponse()

    @Operation(
        summary = "Delete monitor",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $MONITOR_ADMIN",
    )
    @PreAuthorize("hasPermission(#id, '$MONITOR_ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun delete(@PathVariable("id") id: String): Unit = monitorService.deleteByIdOrThrow(id)

    @Operation(
        summary = "Undelete monitor",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $MONITOR_ADMIN",
    )
    @PreAuthorize("hasPermission(#id, '$MONITOR_ADMIN')")
    @DeleteMapping("/{id}/undo")
    @ResponseStatus(HttpStatus.OK)
    fun undelete(@PathVariable("id") id: String): MonitorFullResponse =
        monitorService.undeleteById(id).toFullResponse()

    @Operation(
        summary = "Start previously paused or in maintenance monitor",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $MONITOR_ADMIN",
    )
    @PreAuthorize("hasPermission(#id, '$MONITOR_ADMIN')")
    @PutMapping("/{id}/start")
    @ResponseStatus(HttpStatus.OK)
    fun start(@PathVariable("id") id: String): MonitorFullResponse = monitorService.start(id).toFullResponse()

    @Operation(
        summary = "Pause monitor",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $MONITOR_ADMIN",
    )
    @PreAuthorize("hasPermission(#id, '$MONITOR_ADMIN')")
    @PutMapping("/{id}/pause")
    @ResponseStatus(HttpStatus.OK)
    fun pause(@PathVariable("id") id: String): MonitorFullResponse = monitorService.pause(id).toFullResponse()

    @Operation(
        summary = "Set monitor to maintenance",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $MONITOR_ADMIN",
    )
    @PreAuthorize("hasPermission(#id, '$MONITOR_ADMIN')")
    @PutMapping("/{id}/maintenance")
    @ResponseStatus(HttpStatus.OK)
    fun maintenance(
        @PathVariable(
            "id",
        ) id: String
    ): MonitorFullResponse = monitorService.maintenance(id).toFullResponse()

    @Operation(
        summary = "Get checker",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_MEMBER",
    )
    @GetMapping("/dashboard")
    @ResponseStatus(HttpStatus.OK)
    fun getDashboard(
        authentication: Authentication,
        @RequestParam("teamId") teamId: String?,
    ): MonitorDashboardResponse {
        val user = authService.getByAuthOrThrow(authentication)

        teamId?.let { teamId ->
            user.throwIfNotPartOf {
                permissionRepository.isPartOfByTeamId(user.id, teamId)
            }

            return monitorService.getTeamDashboard(teamId)
        }

        return monitorService.getUserDashboard(user.id)
    }

    private fun Monitor.toMaxResponse() = MonitorMaxResponse(
        this,
        uptime = checkResultService.uptimeStatisticsDto(this),
    )

    private fun Monitor.toFullResponse() = MonitorFullResponse(
        this,
        uptime = checkResultService.uptimeStatisticsDto(this),
        lastCheckResults = checkResultService.getLastByMonitorId(this.id, LAST_CHECK_RESULTS_COUNT),
        oneDayUptime = checkResultService.calculateRecentUptimeByMonitorId(this.id, TimeOption.ONE_DAY).myFormat(),
    )
}
