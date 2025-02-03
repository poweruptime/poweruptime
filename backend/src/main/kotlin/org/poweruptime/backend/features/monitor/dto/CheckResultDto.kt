package org.poweruptime.backend.features.monitor.dto

import org.poweruptime.backend.features.monitor.model.CheckResult
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import java.time.Instant
import java.time.LocalDate

data class CheckResultMinResponse(
    val id: String,
    val status: MonitorStatus,
    val pingMs: Long?,
    val createdAt: Instant,
) {
    constructor(it: CheckResult) : this(it.id, it.status, it.pingMs, it.createdAt)
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
    val monitor: MonitorMinResponse
) {
    constructor(it: CheckResult) : this(
        id = it.id,
        status = it.status,
        pingMs = it.pingMs,
        createdAt = it.createdAt,
        pickedUpAt = it.pickedUpAt,
        checkedAt = it.checkedAt,
        previousStatus = it.previousStatus,
        title = it.title,
        message = it.message,
        monitor = MonitorMinResponse(it.monitor),
    )
}

data class DayUptimeStatistics(
    val name: LocalDate,
    val series: List<DayUptimeStatistic>,
)

data class DayUptimeStatistic(
    val date: LocalDate,
    val name: String,
    val value: String
)
