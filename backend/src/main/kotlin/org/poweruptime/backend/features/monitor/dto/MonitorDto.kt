package org.poweruptime.backend.features.monitor.dto

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.monitor.core.MonitorCheckerData
import org.poweruptime.backend.features.monitor.model.CheckResult
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.team.dto.MinTeamResponse
import java.time.Instant

data class PublicMonitorUptimeStatistics(
    val oneHour: String?,
    val threeHours: String?,
    val sixHours: String?,
    val twelveHours: String?,
    val oneDay: String?,
    val threeDays: String?,
    val oneWeek: String?,
    val twoWeeks: String?,
    val oneMonth: String?,
    val threeMonths: String?,
    val sixMonths: String?,
    val oneYear: String?,
)

data class PublicMonitorResponse(
    val name: String,
    val id: String,
    val status: MonitorStatus,
    val description: String?,
    val uptime: PublicMonitorUptimeStatistics,
    val lastCheckResults: List<CheckResultMinResponse>,
) {
    constructor(
        monitor: Monitor,
        uptime: PublicMonitorUptimeStatistics,
        lastCheckResults: List<CheckResult>,
    ) : this(
        name = monitor.name,
        id = monitor.id,
        status = monitor.status,
        description = monitor.description,
        uptime = uptime,
        lastCheckResults = lastCheckResults.map { CheckResultMinResponse(it) },
    )
}

data class PublicMonitorMinResponse(
    val name: String,
    val id: String,
    val status: MonitorStatus,
    val oneDayUptime: String?,
    val lastCheckResults: List<CheckResultMinResponse>,
) {
    constructor(
        monitor: Monitor,
        oneDayUptime: String?,
        lastCheckResults: List<CheckResult>,
    ) : this(
        name = monitor.name,
        id = monitor.id,
        status = monitor.status,
        oneDayUptime = oneDayUptime,
        lastCheckResults = lastCheckResults.map { CheckResultMinResponse(it) },
    )
}

data class MonitorDashboardResponse(
    val monitorCount: Long,
    val upCount: Long,
    val downCount: Long,
    val maintenanceCount: Long,
    val pausedCount: Long,
)

data class MonitorMinResponse(
    val name: String,
    val id: String,
    val status: MonitorStatus,
) {
    constructor(
        it: Monitor,
    ) : this(
        name = it.name,
        id = it.id,
        status = it.status,
    )
}

data class MonitorResponse(
    val name: String,
    val id: String,
    val status: MonitorStatus,
    val team: MinTeamResponse,
    val deleted: Instant?,
    val lastCheckResults: List<CheckResultMinResponse>,
    val oneDayUptime: String?,
) {
    constructor(
        it: Monitor,
        lastCheckResults: List<CheckResult>,
        oneDayUptime: String?
    ) : this(
        name = it.name,
        id = it.id,
        status = it.status,
        deleted = it.deleted,
        team = MinTeamResponse(it.team),
        lastCheckResults = lastCheckResults.map { CheckResultMinResponse(it) },
        oneDayUptime = oneDayUptime,
    )
}

data class MonitorMaxResponse(
    val name: String,
    val id: String,
    val status: MonitorStatus,
    val team: MinTeamResponse,
    val deleted: Instant?,
    val description: String?,
    val testIntervalSeconds: Long,
    val retries: Long,
    val resendAfter: Long?,
    val upsideDown: Boolean,
    val checker: MonitorCheckerData,
    val uptime: PublicMonitorUptimeStatistics,
) {
    constructor(
        it: Monitor,
        uptime: PublicMonitorUptimeStatistics,
    ) : this(
        name = it.name,
        id = it.id,
        status = it.status,
        team = MinTeamResponse(it.team),
        deleted = it.deleted,
        description = it.description,
        testIntervalSeconds = it.testIntervalSeconds,
        retries = it.retries,
        resendAfter = it.resendAfter,
        upsideDown = it.upsideDown,
        checker = it.checker,
        uptime = uptime,
    )
}

data class MonitorFullResponse(
    val name: String,
    val id: String,
    val status: MonitorStatus,
    val team: MinTeamResponse,
    val deleted: Instant?,
    val description: String?,
    val testIntervalSeconds: Long,
    val retries: Long,
    val resendAfter: Long?,
    val upsideDown: Boolean,
    val checker: MonitorCheckerData,
    val uptime: PublicMonitorUptimeStatistics,
    val lastCheckResults: List<CheckResultMinResponse>,
    val oneDayUptime: String?,
) {
    constructor(
        it: Monitor,
        uptime: PublicMonitorUptimeStatistics,
        lastCheckResults: List<CheckResult>,
        oneDayUptime: String?
    ) : this(
        name = it.name,
        id = it.id,
        status = it.status,
        team = MinTeamResponse(it.team),
        lastCheckResults = lastCheckResults.map { CheckResultMinResponse(it) },
        oneDayUptime = oneDayUptime,
        deleted = it.deleted,
        description = it.description,
        testIntervalSeconds = it.testIntervalSeconds,
        retries = it.retries,
        resendAfter = it.resendAfter,
        upsideDown = it.upsideDown,
        checker = it.checker,
        uptime = uptime,
    )
}

data class CreateMonitorDto(
    @get:NotNull val teamId: String,
    @get:NotBlank @get:Size(min = Database.MIN_NAME_LENGTH, max = Database.MAX_NAME_LENGTH) val name: String,
    val description: String?,
    @get:NotNull @get:Min(
        Database.MIN_TEST_INTERVAL_SECONDS,
    ) @get:Max(Database.MAX_TEST_INTERVAL_SECONDS) val testIntervalSeconds:
    Long,
    @get:NotNull @get:Min(0) val retries: Long,
    @get:Min(1) val resendAfter: Long?,
    @get:NotNull val upsideDown: Boolean,
    @get:NotNull val checker: MonitorCheckerData,
)

data class UpdateMonitorDto(
    @get:NotNull val id: String,
    @get:NotBlank @get:Size(min = Database.MIN_NAME_LENGTH, max = Database.MAX_NAME_LENGTH) val name: String,
    val description: String?,
    @get:NotNull @get:Min(
        Database.MIN_TEST_INTERVAL_SECONDS,
    ) @get:Max(Database.MAX_TEST_INTERVAL_SECONDS) val testIntervalSeconds:
    Long,
    @get:NotNull @get:Min(0) val retries: Long,
    @get:Min(1) val resendAfter: Long?,
    @get:NotNull val upsideDown: Boolean,
    @get:NotNull val checker: MonitorCheckerData,
)
