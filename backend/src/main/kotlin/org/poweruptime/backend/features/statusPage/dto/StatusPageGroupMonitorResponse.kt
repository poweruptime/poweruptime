package org.poweruptime.backend.features.statusPage.dto

import org.poweruptime.backend.features.monitor.dto.MonitorMinResponse
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupMonitor

data class StatusPageGroupMonitorResponse(
    val id: String,
    val position: Int?,
    val monitor: MonitorMinResponse
) {
    constructor(it: StatusPageGroupMonitor) : this(
        id = it.id,
        position = it.position,
        monitor = MonitorMinResponse(it.connection.monitor),
    )
}
