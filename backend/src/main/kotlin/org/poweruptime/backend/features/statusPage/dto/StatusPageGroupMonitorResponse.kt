package org.poweruptime.backend.features.statusPage.dto

import org.poweruptime.backend.features.monitor.dto.MonitorMinResponse
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupMonitorJoinMonitorRecord

data class StatusPageGroupMonitorResponse(val id: String, val position: Int?, val monitor: MonitorMinResponse) {
    constructor(it: StatusPageGroupMonitorJoinMonitorRecord) : this(
        id = it.groupMonitor.publicId,
        position = it.groupMonitor.position,
        monitor = MonitorMinResponse(it.monitor),
    )
}
