package org.poweruptime.backend.features.monitor.model

import org.jetbrains.exposed.v1.core.Column
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.EntityID
import org.jetbrains.exposed.v1.core.dao.id.IdTable
import org.poweruptime.backend.core.models.HasModifiers
import org.poweruptime.backend.core.models.createdAt
import org.poweruptime.backend.core.models.updatedAt

abstract class MonitorDataTable(type: MonitorType) :
    IdTable<ULong>("${MONITOR_CHECKER_DATA_TABLE_NAME}_${type.name}"),
    HasModifiers {
    override val id: Column<EntityID<ULong>> = ulong("id")
        .entityId()
        .references(MonitorTable.id)
        .uniqueIndex()

    override val createdAt = createdAt()
    override val updatedAt = updatedAt()

    abstract fun rowToRecord(row: ResultRow): MonitorData
}

const val MONITOR_CHECKER_DATA_TABLE_NAME = "monitor_data"
