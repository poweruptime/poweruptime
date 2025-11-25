package org.poweruptime.backend.features.monitor.checker

import org.poweruptime.backend.features.monitor.model.CheckResultRecord
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.team.model.TeamRecord

/**
 * Immutable snapshot of everything we know at the start of a check.
 * No derived state, no mutable fields, no business logic.
 */
data class MonitorCheckContext(
    val checkResultId: ULong,
    val monitor: MonitorRecord,
    val team: TeamRecord,
    val previousCheckResult: CheckResultRecord?,
) {
    val isFirstCheckAfterBoot: Boolean
        get() = previousCheckResult == null || monitor.status == MonitorStatus.PENDING
}
