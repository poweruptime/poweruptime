package org.poweruptime.backend.features.monitor.dto

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.monitor.core.MonitorData
import org.poweruptime.backend.features.monitor.core.PingAnalysis
import org.poweruptime.backend.features.monitor.model.CheckResultRecord
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.MonitorType
import org.poweruptime.backend.features.notification.dto.NotificationMethodMinResponse
import org.poweruptime.backend.features.notification.model.NotificationMethodRecord
import org.poweruptime.backend.features.tag.TagDto
import org.poweruptime.backend.features.tag.TagRecord
import org.poweruptime.backend.features.team.dto.TeamMinResponse
import org.poweruptime.backend.features.team.model.TeamRecord
import java.time.Instant

data class PublicMonitorStatistics(val uptime: PublicUptimeStatistics, val ping: PublicPingStatistics)

data class PublicPingStatistics(
    val oneHour: PingAnalysis?,
    val threeHours: PingAnalysis?,
    val sixHours: PingAnalysis?,
    val twelveHours: PingAnalysis?,
    val oneDay: PingAnalysis?,
)

data class PublicUptimeStatistics(
    val oneHour: String,
    val threeHours: String,
    val sixHours: String,
    val twelveHours: String,
    val oneDay: String,
    val threeDays: String,
    val oneWeek: String,
    val twoWeeks: String,
    val oneMonth: String,
    val threeMonths: String,
    val sixMonths: String,
    val oneYear: String,
)

data class PublicMonitorResponse(
    val name: String,
    val id: String,
    val type: MonitorType,
    val status: MonitorStatus,
    val description: String?,
    val statistics: PublicMonitorStatistics,
    val lastCheckResults: List<CheckResultMinResponse>,
) {
    constructor(
        monitor: MonitorRecord,
        statistics: PublicMonitorStatistics,
        lastCheckResults: List<CheckResultRecord>,
    ) : this(
        name = monitor.name,
        id = monitor.publicId,
        type = monitor.type,
        status = monitor.status,
        description = monitor.description,
        statistics = statistics,
        lastCheckResults = lastCheckResults.map { CheckResultMinResponse(it) },
    )
}

data class PublicMonitorMinResponse(
    val name: String,
    val id: String,
    val type: MonitorType,
    val status: MonitorStatus,
    val oneDayUptime: String?,
    val lastCheckResults: List<CheckResultMinResponse>,
) {
    constructor(
        monitor: MonitorRecord,
        oneDayUptime: String?,
        lastCheckResults: List<CheckResultRecord>,
    ) : this(
        name = monitor.name,
        id = monitor.publicId,
        type = monitor.type,
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
) {
    constructor() : this(0, 0, 0, 0, 0)
}

data class MonitorMinResponse(val name: String, val id: String, val type: MonitorType, val status: MonitorStatus) {
    constructor(
        it: MonitorRecord,
    ) : this(
        name = it.name,
        id = it.publicId,
        type = it.type,
        status = it.status,
    )
}

data class MonitorResponse(
    val name: String,
    val id: String,
    val type: MonitorType,
    val status: MonitorStatus,
    val team: TeamMinResponse,
    val deleted: Instant?,
    val tags: List<TagDto>,
    val oneDayUptime: String?,
) {
    constructor(
        monitor: MonitorRecord,
        team: TeamRecord,
        tags: List<TagRecord>,
        oneDayUptime: String?,
    ) : this(
        name = monitor.name,
        id = monitor.publicId,
        type = monitor.type,
        status = monitor.status,
        team = TeamMinResponse(team),
        deleted = monitor.deleted,
        tags = tags.map { TagDto(it) },
        oneDayUptime = oneDayUptime,
    )
}

data class MonitorMaxResponse(
    val name: String,
    val id: String,
    val type: MonitorType,
    val status: MonitorStatus,
    val team: TeamMinResponse,
    val deleted: Instant?,
    val tags: List<TagDto>,
    val notificationMethods: List<NotificationMethodMinResponse>,
    val description: String?,
    val testIntervalSeconds: Long,
    val retries: Long?,
    val resendAfter: Long?,
    val upsideDown: Boolean,
    val data: MonitorData,
    val statistics: PublicMonitorStatistics,
) {
    constructor(
        monitor: MonitorRecord,
        data: MonitorData,
        team: TeamRecord,
        notificationMethods: List<NotificationMethodRecord>,
        tags: List<TagRecord>,
        statistics: PublicMonitorStatistics,
    ) : this(
        name = monitor.name,
        id = monitor.publicId,
        type = monitor.type,
        status = monitor.status,
        team = TeamMinResponse(team),
        deleted = monitor.deleted,
        tags = tags.map { TagDto(it) },
        notificationMethods = notificationMethods.map { NotificationMethodMinResponse(it) },
        description = monitor.description,
        testIntervalSeconds = monitor.testIntervalSeconds,
        retries = monitor.retries,
        resendAfter = monitor.resendAfter,
        upsideDown = monitor.upsideDown,
        data = data,
        statistics = statistics,
    )
}

data class MonitorFullResponse(
    val name: String,
    val id: String,
    val type: MonitorType,
    val status: MonitorStatus,
    val team: TeamMinResponse,
    val deleted: Instant?,
    val tags: List<TagDto>,
    val notificationMethods: List<NotificationMethodMinResponse>,
    val description: String?,
    val testIntervalSeconds: Long,
    val retries: Long?,
    val resendAfter: Long?,
    val upsideDown: Boolean,
    val data: MonitorData,
    val statistics: PublicMonitorStatistics,
    val lastCheckResults: List<CheckResultMinResponse>,
    val oneDayUptime: String?,
) {
    constructor(
        monitor: MonitorRecord,
        data: MonitorData,
        team: TeamRecord,
        notificationMethods: List<NotificationMethodRecord>,
        tags: List<TagRecord>,
        statistics: PublicMonitorStatistics,
        lastCheckResults: List<CheckResultRecord>,
        oneDayUptime: String?,
    ) : this(
        name = monitor.name,
        id = monitor.publicId,
        type = monitor.type,
        status = monitor.status,
        team = TeamMinResponse(team),
        deleted = monitor.deleted,
        tags = tags.map { TagDto(it) },
        notificationMethods = notificationMethods.map { NotificationMethodMinResponse(it) },
        description = monitor.description,
        testIntervalSeconds = monitor.testIntervalSeconds,
        retries = monitor.retries,
        resendAfter = monitor.resendAfter,
        upsideDown = monitor.upsideDown,
        data = data,
        statistics = statistics,
        lastCheckResults = lastCheckResults.map { CheckResultMinResponse(it) },
        oneDayUptime = oneDayUptime,
    )
}

data class CreateMonitorDto(
    @get:NotNull val teamId: String,
    @get:NotBlank @get:Size(min = Database.MIN_NAME_LENGTH, max = Database.MAX_NAME_LENGTH) val name: String,
    val description: String?,
    @get:NotNull @get:Min(
        Database.MIN_TEST_INTERVAL_SECONDS,
    ) @get:Max(Database.MAX_TEST_INTERVAL_SECONDS) val testIntervalSeconds: Long,
    @get:Min(1) val retries: Long?,
    @get:Min(1) val resendAfter: Long?,
    @get:NotNull val upsideDown: Boolean,
    @get:NotNull val data: MonitorData,
    @get:NotNull val notificationMethodIds: List<String>,
    @get:NotNull val tags: List<TagDto>,
)

data class UpdateMonitorDto(
    @get:NotNull val id: String,
    @get:NotBlank @get:Size(min = Database.MIN_NAME_LENGTH, max = Database.MAX_NAME_LENGTH) val name: String,
    val description: String?,
    @get:NotNull @get:Min(
        Database.MIN_TEST_INTERVAL_SECONDS,
    ) @get:Max(Database.MAX_TEST_INTERVAL_SECONDS) val testIntervalSeconds: Long,
    @get:Min(1) val retries: Long?,
    @get:Min(1) val resendAfter: Long?,
    @get:NotNull val upsideDown: Boolean,
    @get:NotNull val data: MonitorData,
    @get:NotNull val notificationMethodIds: List<String>,
    @get:NotNull val tags: List<TagDto>,
)
