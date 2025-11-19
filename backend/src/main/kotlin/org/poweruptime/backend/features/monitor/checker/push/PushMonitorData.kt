package org.poweruptime.backend.features.monitor.checker.push

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.monitor.model.MonitorData
import org.poweruptime.backend.features.monitor.model.MonitorDataTable
import org.poweruptime.backend.features.monitor.model.MonitorType

object PushMonitorData : MonitorDataTable(MonitorType.PUSH) {
    val pushId = varchar("push_id", Database.MAX_PUSH_ID_LENGTH).uniqueIndex()

    override fun rowToRecord(row: ResultRow): PushMonitorDataRecord = PushMonitorDataRecord(
        pushId = row[pushId],
    )

    override fun insert(monitorId: ULong, data: MonitorData) {
        data as PushMonitorDataRecord

        insert {
            it[PushMonitorData.id] = monitorId
            it[PushMonitorData.pushId] = data.pushId
        }
    }

    override fun update(monitorId: ULong, data: MonitorData) {
        data as PushMonitorDataRecord

        update({ id eq monitorId }) {
            it[PushMonitorData.pushId] = data.pushId
        }
    }

    init {
        registerTable(this)
    }
}

data class PushMonitorDataRecord(
    @get:NotBlank
    @get:Size(min = Database.MIN_PUSH_ID_LENGTH, max = Database.MAX_PUSH_ID_LENGTH)
    val pushId: String,
) : MonitorData(MonitorType.PUSH)
