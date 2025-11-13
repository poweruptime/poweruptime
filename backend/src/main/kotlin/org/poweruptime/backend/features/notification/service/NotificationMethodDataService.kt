package org.poweruptime.backend.features.notification.service

import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.core.domain.deleteById
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.model.NotificationMethodData
import org.poweruptime.backend.features.notification.model.NotificationMethodDataTable
import org.poweruptime.backend.features.notification.model.NotificationMethodRecord
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class NotificationMethodDataService {
    fun findByIdAndType(id: ULong, type: NotificationMethodType): NotificationMethodData =
        NotificationMethodDataTable.getByType(type).let { table ->
            table.selectAll()
                .where {
                    table.id eq id
                }.limit(1)
                .firstOrNull()
                ?.let { table.rowToRecord(it) }
                ?: throw BadRequestException("$type notification method data with id $id not found")
        }

    @Transactional
    fun insert(
        notificationMethod: NotificationMethodRecord,
        data: NotificationMethodData
    ): NotificationMethodData = NotificationMethodDataTable
        .getByType(notificationMethod.type)
        .insert(notificationMethod.id, data)
        .let {
            findByIdAndType(notificationMethod.id, notificationMethod.type)
        }

    @Transactional
    fun update(
        oldNotificationMethod: NotificationMethodRecord,
        updatedNotificationMethod: NotificationMethodRecord,
        data: NotificationMethodData
    ): NotificationMethodData = if (oldNotificationMethod.type !== updatedNotificationMethod.type) {
        NotificationMethodDataTable.getByType(oldNotificationMethod.type).deleteById(oldNotificationMethod.id)

        insert(updatedNotificationMethod, data)
    } else {
        NotificationMethodDataTable
            .getByType(updatedNotificationMethod.type)
            .update(updatedNotificationMethod.id, data)
            .let {
                findByIdAndType(updatedNotificationMethod.id, updatedNotificationMethod.type)
            }
    }
}
