package org.poweruptime.backend.features.monitor.core

import org.jetbrains.exposed.v1.core.Column
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.EntityID
import org.jetbrains.exposed.v1.core.dao.id.IdTable
import org.poweruptime.backend.core.models.HasModifiers
import org.poweruptime.backend.core.models.createdAt
import org.poweruptime.backend.core.models.updatedAt
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.MonitorType

abstract class MonitorDataTable(
    @Suppress("PropertyName", "ConstructorParameterNaming") val _type: MonitorType
) : IdTable<ULong>("${MONITOR_CHECKER_DATA_TABLE_NAME}_${_type.name}"),
    HasModifiers {
    override val id: Column<EntityID<ULong>> = ulong("id")
        .entityId()
        .references(Monitor.id)
        .uniqueIndex()

    override val createdAt = createdAt()
    override val updatedAt = updatedAt()

    abstract fun rowToRecord(row: ResultRow): MonitorData

    abstract fun insert(monitorId: ULong, data: MonitorData)
    abstract fun update(monitorId: ULong, data: MonitorData)

    companion object {
        private val registry = mutableMapOf<MonitorType, MonitorDataTable>()

        fun registerTable(table: MonitorDataTable) {
            registry[table._type] = table
        }

        fun getByType(type: MonitorType): MonitorDataTable =
            registry[type] ?: error("Unknown monitor type: $type")
    }
}

const val MONITOR_CHECKER_DATA_TABLE_NAME = "monitor_data"
