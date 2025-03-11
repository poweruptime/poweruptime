package org.poweruptime.backend.features.monitor.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.REQUIRED_AUTH
import org.poweruptime.backend.core.SYSTEM_ROLE_ADMIN
import org.poweruptime.backend.core.dto.PaginatedResponse
import org.poweruptime.backend.core.dto.toDto
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.core.utils.DATETIME_FORMAT
import org.poweruptime.backend.features.authentication.domain.PermissionRepository
import org.poweruptime.backend.features.authentication.domain.throwIfNotPartOf
import org.poweruptime.backend.features.authentication.permission.CHECK_RESULT_MEMBER
import org.poweruptime.backend.features.authentication.permission.MONITOR_MEMBER
import org.poweruptime.backend.features.authentication.permission.TEAM_MEMBER
import org.poweruptime.backend.features.authentication.service.AuthService
import org.poweruptime.backend.features.monitor.domain.CheckResultRepository
import org.poweruptime.backend.features.monitor.dto.CheckResultResponse
import org.poweruptime.backend.features.monitor.dto.PingTimelineResponse
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.service.CheckResultService
import org.poweruptime.backend.features.monitor.service.buildPingTimelineResponse
import org.poweruptime.backend.features.monitor.service.generatePingTimelineEntries
import org.springdoc.core.annotations.ParameterObject
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import java.time.ZonedDateTime

@RestController
@RequestMapping("/v1/check-result")
@Tag(name = "Check Result API")
class CheckResultController(
    private val checkResultRepository: CheckResultRepository,
    private val checkResultService: CheckResultService,
    private val authService: AuthService,
    private val permissionRepository: PermissionRepository
) {
    @Operation(
        summary = "Get check results",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_MEMBER",
    )
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    fun getAll(
        auth: Authentication,
        @ParameterObject @PageableDefault pageable: Pageable,
        @RequestParam("monitorId") monitorId: String?,
        @RequestParam("teamId") teamId: String?,
        @RequestParam("onlyChanges") onlyChanges: Boolean = false,
        @RequestParam("statuses") statuses: List<MonitorStatus>?,
    ): PaginatedResponse<CheckResultResponse> {
        if (monitorId != null && teamId != null) {
            throw BadRequestException("Monitor or Team id required")
        }

        val user = authService.getByAuthOrThrow(auth)

        monitorId?.let { monitorId ->
            user.throwIfNotPartOf {
                permissionRepository.isPartOfByMonitorId(user.id, monitorId)
            }
        }

        teamId?.let { teamId ->
            user.throwIfNotPartOf {
                permissionRepository.isPartOfByTeamId(user.id, teamId)
            }
        }

        return checkResultService.getAllPaginated(
            pageable = pageable,
            monitorId = monitorId,
            teamId = teamId,
            userId = if (teamId == null && monitorId == null) user.id else null,
            statuses = statuses,
            onlyChanges = onlyChanges,
        ).toDto {
            CheckResultResponse(it)
        }
    }

    @Operation(
        summary = "Get check result",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_MEMBER",
    )
    @PreAuthorize("hasPermission(#id, '$CHECK_RESULT_MEMBER')")
    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun get(@PathVariable id: String): CheckResultResponse = CheckResultResponse(checkResultService.getByIdOrThrow(id))

    @Operation(
        summary = "Get ping timeline",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_MEMBER",
    )
    @GetMapping("/ping")
    @PreAuthorize("hasPermission(#monitorId, '$MONITOR_MEMBER')")
    @ResponseStatus(HttpStatus.OK)
    fun getPingTimeline(
        @RequestParam("monitorId") monitorId: String,
        @RequestParam("start") @DateTimeFormat(pattern = DATETIME_FORMAT) start: ZonedDateTime,
        @RequestParam("end") @DateTimeFormat(pattern = DATETIME_FORMAT) end: ZonedDateTime,
        // Min 2 minutes, max 2 days
        @RequestParam("precision") @Min(2) @Max(2880) precisionInMinutes: Long,
    ): PingTimelineResponse {
        val startInstant = start.toInstant()
        val endInstant = end.toInstant()

        // Validate time window
        val durationMillis = endInstant.toEpochMilli() - startInstant.toEpochMilli()
        val precisionMillis = precisionInMinutes * 60_000

        if (durationMillis < precisionMillis) {
            throw BadRequestException("Timeline precision smaller than selected window")
        }

        // 31 days in milliseconds
        if (durationMillis > 31 * 24 * 60 * 60 * 1000L) {
            throw BadRequestException("Selected window may not exceed 1 month")
        }

        // Create timeline entries
        val entries = generatePingTimelineEntries(startInstant, endInstant, precisionMillis)

        // Adjust date range for query
        val halfPrecisionSeconds = (precisionInMinutes * 60) / 2
        val adjustedStartInstant = startInstant.minusSeconds(halfPrecisionSeconds)
        val adjustedEndInstant = endInstant.plusSeconds(halfPrecisionSeconds)

        // Get check results
        val checkResults = checkResultRepository.findByMonitorIdAndPickedUpBetween(
            monitorId,
            adjustedStartInstant,
            adjustedEndInstant,
        )

        // Build timeline data
        return buildPingTimelineResponse(entries, checkResults, halfPrecisionSeconds)
    }
}
