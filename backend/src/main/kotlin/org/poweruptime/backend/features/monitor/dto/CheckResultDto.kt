package org.poweruptime.backend.features.monitor.dto

import org.poweruptime.backend.features.monitor.model.CheckResultJoinMonitorAndTeamRecord
import org.poweruptime.backend.features.monitor.model.CheckResultRecord
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.team.dto.TeamMinResponse
import java.time.Instant
import java.time.LocalDate

data class CheckResultMinResponse(
    val id: String,
    val status: MonitorStatus,
    val pingMs: Long?,
    val createdAt: Instant,
) {
    constructor(it: CheckResultRecord) : this(it.publicId, it.status, it.pingMs, it.createdAt)
}

data class CheckResultResponse(
    val id: String,
    val status: MonitorStatus,
    val pingMs: Long?,
    val createdAt: Instant,
    val pickedUpAt: Instant?,
    val checkedAt: Instant?,
    val previousStatus: MonitorStatus?,
    val title: String?,
    val message: String?,
    val monitor: MonitorMinResponse,
    val team: TeamMinResponse,
) {
    constructor(it: CheckResultJoinMonitorAndTeamRecord) : this(
        id = it.checkResult.publicId,
        status = it.checkResult.status,
        pingMs = it.checkResult.pingMs,
        createdAt = it.checkResult.createdAt,
        pickedUpAt = it.checkResult.pickedUpAt,
        checkedAt = it.checkResult.checkedAt,
        previousStatus = it.checkResult.previousStatus,
        title = it.checkResult.title,
        message = it.checkResult.message,
        monitor = MonitorMinResponse(it.monitor),
        team = TeamMinResponse(it.team),
    )
}

data class DayUptimeStatistics(val name: LocalDate, val series: List<DayUptimeStatistic>)

data class DayUptimeStatistic(val date: LocalDate, val name: String, val value: String)

data class PingTimelineResponse(
    val smallestValue: Long = 0,
    val highestValue: Long = 0,
    val data: List<PingTimelineDataEntryResponse> = listOf(),
)

data class PingTimelineDataEntryResponse(val name: Instant, var value: Long = 0)
