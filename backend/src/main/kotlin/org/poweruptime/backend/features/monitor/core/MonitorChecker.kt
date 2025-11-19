package org.poweruptime.backend.features.monitor.core

import org.poweruptime.backend.features.monitor.model.MonitorData
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.MonitorType

abstract class MonitorChecker(
    val type: MonitorType
) {
    abstract fun execute(monitor: MonitorRecord, data: MonitorData): CheckResultDto
}
