package org.poweruptime.backend.features.monitor.checker.push

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.jetbrains.exposed.v1.core.ResultRow
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.monitor.model.MonitorData
import org.poweruptime.backend.features.monitor.model.MonitorDataTable
import org.poweruptime.backend.features.monitor.model.MonitorType

object PushMonitorDataTable : MonitorDataTable(MonitorType.PUSH) {
    val pushId = varchar("push_id", Database.MAX_PUSH_ID_LENGTH).uniqueIndex()

    override fun rowToRecord(row: ResultRow): PushMonitorDataRecord = PushMonitorDataRecord(
        pushId = row[pushId],
    )
}

data class PushMonitorDataRecord(
    @get:NotBlank
    @get:Size(min = Database.MIN_PUSH_ID_LENGTH, max = Database.MAX_PUSH_ID_LENGTH)
    val pushId: String,
) : MonitorData(MonitorType.PUSH)
