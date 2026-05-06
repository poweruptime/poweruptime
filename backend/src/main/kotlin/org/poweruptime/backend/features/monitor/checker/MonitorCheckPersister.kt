package org.poweruptime.backend.features.monitor.checker

import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.features.maintenance.service.MaintenanceService
import org.poweruptime.backend.features.monitor.model.CheckResult
import org.poweruptime.backend.features.monitor.model.CheckResultRecord
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.service.CheckResultService
import org.poweruptime.backend.features.monitor.service.MonitorService
import org.springframework.stereotype.Component
import java.time.Duration

@Component
class MonitorCheckPersister(
    private val checkResultService: CheckResultService,
    private val monitorService: MonitorService,
    private val maintenanceService: MaintenanceService,
) {
    /**
     * Persists check result. Returns updated record from DB.
     * MUST be called in a transaction.
     */
    fun saveCheckResult(checkResultId: ULong, outcome: CheckExecutionOutcome): CheckResultRecord {
        when (outcome) {
            is CheckExecutionOutcome.Late -> {
                CheckResult.update({ CheckResult.id eq checkResultId }) {
                    it[status] = MonitorStatus.DOWN
                    it[pickedUpAt] = outcome.pickedUpAt
                    it[title] = "Monitor health check was picked up too late."
                    it[message] = buildLatePickupMessage(checkResultId, outcome)
                }
            }

            is CheckExecutionOutcome.Skipped -> {
                val maintenanceId = if (outcome.status == MonitorStatus.MAINTENANCE) {
                    checkResultService.getById(checkResultId).let {
                        maintenanceService.findActiveByMonitorId(it.monitorId)?.id
                    }
                } else {
                    null
                }
                CheckResult.update({ CheckResult.id eq checkResultId }) {
                    it[status] = outcome.status
                    it[CheckResult.maintenanceId] = maintenanceId
                    it[pickedUpAt] = outcome.pickedUpAt
                    it[title] = "Monitor ${outcome.status.name.uppercase()}"
                }
            }

            is CheckExecutionOutcome.Completed -> {
                CheckResult.update({ CheckResult.id eq checkResultId }) {
                    it[status] = outcome.status
                    it[pickedUpAt] = outcome.pickedUpAt
                    it[checkedAt] = outcome.checkedAt
                    it[pingMs] = outcome.pingMs
                    it[title] = outcome.title
                    it[message] = outcome.message
                    it[timesRetried] = outcome.timesRetried
                    it[previousStatus] = outcome.previousStatus
                }
            }
        }

        return checkResultService.getById(checkResultId)
    }

    /**
     * Updates monitor status if needed. Returns true if updated.
     * MUST be called in a transaction.
     */
    fun updateMonitorStatus(monitorId: ULong, newStatus: MonitorStatus): Boolean {
        val rowsUpdated = monitorService.updateStatus(monitorId, newStatus)
        return rowsUpdated > 0
    }

    private fun buildLatePickupMessage(checkResultId: ULong, outcome: CheckExecutionOutcome.Late): String {
        val checkResult = checkResultService.getById(checkResultId)
        return """
            |Created at: ${checkResult.createdAt}
            |Picked up at: ${outcome.pickedUpAt}
            |Difference: ${Duration.between(checkResult.createdAt, outcome.pickedUpAt).toMillis()}ms
        """.trimMargin()
    }
}
