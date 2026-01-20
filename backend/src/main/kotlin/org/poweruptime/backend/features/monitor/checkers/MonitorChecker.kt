package org.poweruptime.backend.features.monitor.checkers

import org.poweruptime.backend.features.monitor.core.MonitorData
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.MonitorType

abstract class MonitorChecker(val type: MonitorType) {
    abstract fun execute(monitor: MonitorRecord, data: MonitorData): CheckResultDto
}
