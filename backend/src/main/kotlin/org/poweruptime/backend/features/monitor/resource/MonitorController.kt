package org.poweruptime.backend.features.monitor.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.REQUIRED_AUTH
import org.poweruptime.backend.core.SYSTEM_ROLE_ADMIN
import org.poweruptime.backend.core.domain.findIdByPublicIdOrThrow
import org.poweruptime.backend.core.dto.CloneDto
import org.poweruptime.backend.core.dto.Pageable
import org.poweruptime.backend.core.dto.PaginatedResponse
import org.poweruptime.backend.core.dto.toDto
import org.poweruptime.backend.core.exceptions.ForbiddenException
import org.poweruptime.backend.features.authentication.domain.PermissionsService
import org.poweruptime.backend.features.authentication.domain.ensureAllInTeam
import org.poweruptime.backend.features.authentication.domain.throwIfNotPartOf
import org.poweruptime.backend.features.authentication.permission.*
import org.poweruptime.backend.features.authentication.service.publicUserId
import org.poweruptime.backend.features.authentication.service.userId
import org.poweruptime.backend.features.monitor.core.TimeOption
import org.poweruptime.backend.features.monitor.dto.*
import org.poweruptime.backend.features.monitor.model.MonitorRecordJoinTeamRecord
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.MonitorType
import org.poweruptime.backend.features.monitor.service.CheckResultStatisticsService
import org.poweruptime.backend.features.monitor.service.MonitorDataService
import org.poweruptime.backend.features.monitor.service.MonitorService
import org.poweruptime.backend.features.monitor.service.myFormat
import org.poweruptime.backend.features.notification.service.NotificationMethodService
import org.poweruptime.backend.features.statusPage.service.StatusPageGroupService
import org.poweruptime.backend.features.tag.TagService
import org.poweruptime.backend.features.team.model.Team
import org.poweruptime.backend.features.team.service.TeamService
import org.springdoc.core.annotations.ParameterObject
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*

const val LAST_CHECK_RESULTS_COUNT = 22

@RestController
@RequestMapping("/v1/monitor")
@Tag(name = "Monitor API")
class MonitorController(
    private val monitorService: MonitorService,
    private val teamService: TeamService,
    private val monitorDataService: MonitorDataService,
    private val notificationMethodService: NotificationMethodService,
    private val tagService: TagService,
    private val statusPageGroupService: StatusPageGroupService,
    private val checkResultStatisticsService: CheckResultStatisticsService,
    private val permissionsService: PermissionsService,
) {
    @Operation(
        summary = "Get monitor",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_MEMBER",
    )
    @PreAuthorize("hasPermission(#publicId, '$MONITOR_MEMBER')")
    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun get(
        @PathVariable("id") publicId: String
    ): MonitorMaxResponse = monitorService.getIdByPublicId(publicId).let { id ->
        monitorService.getJoinTeamById(id).toMaxResponse()
    }

    @Suppress("LongMethod")
    @Operation(
        summary = "Get all monitors",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_MEMBER",
    )
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    fun getAll(
        auth: Authentication,
        @ParameterObject pageable: Pageable,
        @RequestParam("teamId") publicTeamId: String?,
        @RequestParam("name") name: String?,
        @RequestParam("enabledNotificationMethodIds") publicEnabledNotificationMethodIds: Set<String>?,
        @RequestParam("statuses") statuses: List<MonitorStatus>?,
        @RequestParam("types") types: List<MonitorType>?,
        @RequestParam("tags") tags: List<String>?,
        @RequestParam("usedInStatusPageGroupIds") publicUsedInStatusPageGroupIds: Set<String>?,
        @RequestParam("deleted") deleted: Boolean = false
    ): PaginatedResponse<MonitorResponse> {
        publicTeamId?.let {
            auth.throwIfNotPartOf { publicUserId ->
                permissionsService.isPartOfByTeamId(publicUserId, it)
            }
        }

        val teamId = publicTeamId?.let { teamService.getIdByPublicId(publicTeamId) }

        val monitors = monitorService.getAllPaginated(
            pageable = pageable,
            teamId = teamId,
            userId = if (publicTeamId == null) auth.userId() else null,
            statuses = statuses,
            types = types,
            name = name,
            tags = tags,
            enabledNotificationMethodIds = publicEnabledNotificationMethodIds?.toList()?.let { publicIds ->
                notificationMethodService.getIdsByPublicIds(publicIds).also {
                    if (teamId != null) {
                        notificationMethodService.getByPublicId(
                            publicIds,
                        ).ensureAllInTeam(teamId) { it.teamId }.map { it.id }
                    } else {
                        permissionsService.isPartOfByNotificationMethodIds(auth.publicUserId(), publicIds)
                    }
                }
            },
            usedInStatusPageGroupIds = publicUsedInStatusPageGroupIds?.toList()?.let { publicIds ->
                statusPageGroupService.getIdsByPublicIds(publicIds).also { statusPageGroupIds ->
                    if (teamId != null) {
                        if (!statusPageGroupService.ensureAllStatusGroupsInTeam(
                                statusPageGroupIds = statusPageGroupIds,
                                teamId = teamId,
                            )
                        ) {
                            throw ForbiddenException("Can only check for status page groups in same team")
                        }
                    } else {
                        permissionsService.isPartOfByStatusPageGroupIds(auth.publicUserId(), publicIds)
                    }
                }
            },
            deleted = deleted,
        )

        val monitorIds = monitors.map {
            it.monitor.id
        }.content

        val tagsPerMonitor = tagService.getByMonitorId(monitorIds)

        return monitors.toDto {
            MonitorResponse(
                monitor = it.monitor,
                team = it.team,
                tags = tagsPerMonitor[it.monitor.id] ?: emptyList(),
                oneDayUptime = checkResultStatisticsService.calculateRecentUptimeByMonitorId(
                    it.monitor.id,
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
    @PreAuthorize("hasPermission(#publicId, '$MONITOR_ADMIN')")
    @PutMapping("/{id}/clone")
    @ResponseStatus(HttpStatus.OK)
    fun clone(@PathVariable("id") publicId: String, @RequestBody @Valid cloneDto: CloneDto): MonitorFullResponse =
        monitorService.clone(
            publicMonitorId = publicId,
            teamId = cloneDto.teamId?.let { publicTeamId -> teamService.getIdByPublicId(publicTeamId) },
        ).toFullResponse()

    @Operation(
        summary = "Delete monitor",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $MONITOR_ADMIN",
    )
    @PreAuthorize("hasPermission(#publicId, '$MONITOR_ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun delete(@PathVariable("id") publicId: String) {
        val id = monitorService.getIdByPublicId(publicId)
        monitorService.deleteById(id)
    }

    @Operation(
        summary = "Undelete monitor",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $MONITOR_ADMIN",
    )
    @PreAuthorize("hasPermission(#publicId, '$MONITOR_ADMIN')")
    @DeleteMapping("/{id}/undo")
    @ResponseStatus(HttpStatus.OK)
    fun undelete(@PathVariable("id") publicId: String): MonitorFullResponse =
        monitorService.getIdByPublicId(publicId, includeDeleted = true).let { id ->
            monitorService.undeleteById(id).toFullResponse()
        }

    @Operation(
        summary = "Start previously paused or in maintenance monitor",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $MONITOR_ADMIN",
    )
    @PreAuthorize("hasPermission(#publicId, '$MONITOR_ADMIN')")
    @PutMapping("/{id}/start")
    @ResponseStatus(HttpStatus.OK)
    fun start(@PathVariable("id") publicId: String): MonitorFullResponse =
        monitorService.getIdByPublicId(publicId).let { id ->
            monitorService.start(id).toFullResponse()
        }

    @Operation(
        summary = "Pause monitor",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $MONITOR_ADMIN",
    )
    @PreAuthorize("hasPermission(#publicId, '$MONITOR_ADMIN')")
    @PutMapping("/{id}/pause")
    @ResponseStatus(HttpStatus.OK)
    fun pause(@PathVariable("id") publicId: String): MonitorFullResponse =
        monitorService.getIdByPublicId(publicId).let { id ->
            monitorService.pause(id).toFullResponse()
        }

    @Operation(
        summary = "Set monitor to maintenance",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $MONITOR_ADMIN",
    )
    @PreAuthorize("hasPermission(#publicId, '$MONITOR_ADMIN')")
    @PutMapping("/{id}/maintenance")
    @ResponseStatus(HttpStatus.OK)
    fun maintenance(@PathVariable("id") publicId: String): MonitorFullResponse =
        monitorService.getIdByPublicId(publicId).let { id ->
            monitorService.maintenance(id).toFullResponse()
        }

    @Operation(
        summary = "Get checker",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_MEMBER",
    )
    @GetMapping("/dashboard")
    @ResponseStatus(HttpStatus.OK)
    @Transactional(readOnly = true)
    fun getDashboard(
        auth: Authentication,
        @RequestParam("teamId") publicTeamId: String?,
    ): MonitorDashboardResponse {
        publicTeamId?.let { publicTeamId ->
            auth.throwIfNotPartOf { publicUserId ->
                permissionsService.isPartOfByTeamId(publicUserId, publicTeamId)
            }

            return monitorService.getTeamDashboard(Team.findIdByPublicIdOrThrow(publicTeamId))
        }

        return monitorService.getUserDashboard(auth.userId())
    }

    fun MonitorRecordJoinTeamRecord.toMaxResponse() = MonitorMaxResponse(
        monitor = monitor,
        data = monitorDataService.findByIdAndType(monitor.id, monitor.type),
        team = team,
        notificationMethods = notificationMethodService.getByMonitorId(monitor.id),
        tags = tagService.getByMonitorId(monitor.id),
        uptime = checkResultStatisticsService.uptimeStatisticsDto(monitor.id),
    )

    fun MonitorRecordJoinTeamRecord.toFullResponse() = MonitorFullResponse(
        monitor = monitor,
        data = monitorDataService.findByIdAndType(monitor.id, monitor.type),
        team = team,
        notificationMethods = notificationMethodService.getByMonitorId(monitor.id),
        tags = tagService.getByMonitorId(monitor.id),
        uptime = checkResultStatisticsService.uptimeStatisticsDto(monitor.id),
        lastCheckResults = checkResultStatisticsService.getLastByMonitorId(monitor.id, LAST_CHECK_RESULTS_COUNT),
        oneDayUptime = checkResultStatisticsService.calculateRecentUptimeByMonitorId(
            monitor.id,
            TimeOption.ONE_DAY,
        ).myFormat(),
    )
}
