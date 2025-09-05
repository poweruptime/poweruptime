package org.poweruptime.backend.features.notification.model

import org.jetbrains.exposed.v1.core.Column
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.EntityID
import org.jetbrains.exposed.v1.core.dao.id.IdTable
import org.poweruptime.backend.core.models.HasModifiers
import org.poweruptime.backend.core.models.createdAt
import org.poweruptime.backend.core.models.updatedAt
import org.poweruptime.backend.features.notification.core.NotificationMethodType

abstract class NotificationMethodDataTable(type: NotificationMethodType) :
    IdTable<ULong>("${NOTIFICATION_METHOD_DATA_TABLE_NAME}_${type.name}"),
    HasModifiers {
    override val id: Column<EntityID<ULong>> = ulong("id")
        .entityId()
        .references(NotificationMethodTable.id)
        .uniqueIndex()

    override val createdAt = createdAt()
    override val updatedAt = updatedAt()

    abstract fun rowToRecord(row: ResultRow): NotificationMethodData
}

const val NOTIFICATION_METHOD_DATA_TABLE_NAME = "notification_method_data"
