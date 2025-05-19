package org.poweruptime.backend.features.monitor.core

import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.MonitorType

interface MonitorChecker {
    val type: MonitorType

    fun execute(monitor: Monitor): CheckResultDto
}
