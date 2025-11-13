package org.poweruptime.backend.features.monitor.service

import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.core.domain.deleteById
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.features.monitor.model.MonitorData
import org.poweruptime.backend.features.monitor.model.MonitorDataTable
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.MonitorType
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class MonitorDataService {
    fun findByIdAndType(id: ULong, type: MonitorType): MonitorData =
        MonitorDataTable.getByType(type).let { table ->
            table.selectAll()
                .where {
                    table.id eq id
                }.limit(1)
                .firstOrNull()
                ?.let { table.rowToRecord(it) }
                ?: throw BadRequestException("$type monitor data not found")
        }

    @Transactional
    fun insert(monitor: MonitorRecord, data: MonitorData): MonitorData = MonitorDataTable
        .getByType(monitor.type)
        .insert(monitor.id, data)
        .let {
            findByIdAndType(monitor.id, monitor.type)
        }

    @Transactional
    fun update(
        oldMonitor: MonitorRecord,
        updatedMonitor: MonitorRecord,
        data: MonitorData
    ): MonitorData = if (oldMonitor.type !== updatedMonitor.type) {
        MonitorDataTable.getByType(oldMonitor.type).deleteById(oldMonitor.id)

        insert(updatedMonitor, data)
    } else {
        MonitorDataTable.getByType(updatedMonitor.type)
            .update(updatedMonitor.id, data)
            .let {
                findByIdAndType(updatedMonitor.id, updatedMonitor.type)
            }
    }
}
