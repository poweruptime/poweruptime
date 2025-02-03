package org.poweruptime.backend.features.monitor.core

import org.poweruptime.backend.features.monitor.model.Monitor

interface MonitorChecker {
    val type: MonitorCheckerType

    fun execute(monitor: Monitor): CheckResultDto
}
