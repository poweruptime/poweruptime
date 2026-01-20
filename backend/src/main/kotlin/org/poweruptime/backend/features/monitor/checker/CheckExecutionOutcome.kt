package org.poweruptime.backend.features.monitor.checker

import org.poweruptime.backend.features.monitor.model.MonitorStatus
import java.time.Instant

/**
 * Sum type representing all possible check outcomes.
 */
sealed class CheckExecutionOutcome {
    data class Late(val pickedUpAt: Instant) : CheckExecutionOutcome()

    data class Skipped(val status: MonitorStatus, val pickedUpAt: Instant) : CheckExecutionOutcome()

    data class Completed(
        val status: MonitorStatus,
        val pickedUpAt: Instant,
        val checkedAt: Instant,
        val pingMs: Long,
        val title: String,
        val message: String?,
        val timesRetried: Long,
        val previousStatus: MonitorStatus,
    ) : CheckExecutionOutcome()
}
