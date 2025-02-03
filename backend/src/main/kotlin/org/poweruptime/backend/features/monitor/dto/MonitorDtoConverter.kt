package org.poweruptime.backend.features.monitor.dto

import org.poweruptime.backend.features.monitor.core.MonitorCheckerData
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.team.model.Team

fun Monitor.Companion.fromDto(it: CreateMonitorDto, team: Team, attachedChecker: MonitorCheckerData): Monitor = Monitor(
    name = it.name,
    description = it.description,
    testIntervalSeconds = it.testIntervalSeconds,
    retries = it.retries,
    upsideDown = it.upsideDown,
    checker = attachedChecker,
    resendAfter = it.resendAfter,
    team = team,
)

fun Monitor.update(it: UpdateMonitorDto, attachedChecker: MonitorCheckerData): Monitor {
    name = it.name
    description = it.description
    testIntervalSeconds = it.testIntervalSeconds
    retries = it.retries
    upsideDown = it.upsideDown
    resendAfter = it.resendAfter
    checker = attachedChecker

    return this
}
