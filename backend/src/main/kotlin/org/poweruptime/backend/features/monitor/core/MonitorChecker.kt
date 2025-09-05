package org.poweruptime.backend.features.monitor.core

import org.poweruptime.backend.features.monitor.model.MonitorData
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.MonitorType

interface MonitorChecker {
    val type: MonitorType

    fun execute(monitor: MonitorRecord, data: MonitorData): CheckResultDto
}
