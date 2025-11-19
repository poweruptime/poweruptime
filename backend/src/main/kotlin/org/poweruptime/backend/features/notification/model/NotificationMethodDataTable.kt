package org.poweruptime.backend.features.notification.model

import org.jetbrains.exposed.v1.core.Column
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.EntityID
import org.jetbrains.exposed.v1.core.dao.id.IdTable
import org.poweruptime.backend.core.models.HasModifiers
import org.poweruptime.backend.core.models.createdAt
import org.poweruptime.backend.core.models.updatedAt
import org.poweruptime.backend.features.notification.core.NotificationMethodType

abstract class NotificationMethodDataTable(
    @Suppress("PropertyName", "ConstructorParameterNaming") val _type: NotificationMethodType
) : IdTable<ULong>("${NOTIFICATION_METHOD_DATA_TABLE_NAME}_${_type.name}"),
    HasModifiers {
    override val id: Column<EntityID<ULong>> = ulong("id")
        .entityId()
        .references(NotificationMethod.id)
        .uniqueIndex()

    override val createdAt = createdAt()
    override val updatedAt = updatedAt()

    abstract fun rowToRecord(row: ResultRow): NotificationMethodData

    abstract fun insert(notificationMethodId: ULong, data: NotificationMethodData)
    abstract fun update(notificationMethodId: ULong, data: NotificationMethodData)

    companion object {
        private val registry = mutableMapOf<NotificationMethodType, NotificationMethodDataTable>()

        fun registerTable(table: NotificationMethodDataTable) {
            registry[table._type] = table
        }

        fun getByType(type: NotificationMethodType): NotificationMethodDataTable =
            registry[type] ?: error("Unknown notification method type: $type")
    }
}

const val NOTIFICATION_METHOD_DATA_TABLE_NAME = "notification_method_data"
