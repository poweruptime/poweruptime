package org.poweruptime.backend.features.notification.domain

import org.jetbrains.exposed.v1.core.lowerCase
import org.jetbrains.exposed.v1.jdbc.andWhere
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.core.domain.deletedFilter
import org.poweruptime.backend.core.domain.pageQuery
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.model.MonitorNotificationMethodTable
import org.poweruptime.backend.features.notification.model.NotificationMethodRecord
import org.poweruptime.backend.features.notification.model.NotificationMethodTable
import org.poweruptime.backend.features.notification.model.rowToNotificationMethodRecord
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

fun NotificationMethodTable.findByMonitorId(
    monitorId: ULong
): List<NotificationMethodRecord> = innerJoin(MonitorNotificationMethodTable).selectAll().where {
    MonitorNotificationMethodTable.monitorId eq monitorId
}.map {
    rowToNotificationMethodRecord(it)
}

fun NotificationMethodTable.findAll(
    pageable: Pageable,
    teamId: ULong,
    name: String?,
    types: List<NotificationMethodType>?,
    useByDefault: Boolean?,
    deleted: Boolean = false,
): Page<NotificationMethodRecord> {
    val query = selectAll()

    query.andWhere { NotificationMethodTable.deleted.deletedFilter(deleted) }
    query.andWhere { NotificationMethodTable.teamId eq teamId }

    name?.takeIf { it.isNotEmpty() }?.let {
        query.andWhere { NotificationMethodTable.name.lowerCase() like "%${it.lowercase()}%" }
    }

    types?.takeIf { it.isNotEmpty() }?.let {
        query.andWhere { NotificationMethodTable.type inList it }
    }

    useByDefault?.let {
        query.andWhere { NotificationMethodTable.useByDefault eq it }
    }

    return pageQuery(
        query,
        pageable,
        sort = {
            when (it) {
                "name" -> NotificationMethodTable.name
                "useByDefault" -> NotificationMethodTable.useByDefault
                "type" -> NotificationMethodTable.type
                "createdAt" -> NotificationMethodTable.createdAt
                "deleted" -> NotificationMethodTable.deleted
                else -> null
            }
        },
        map = { rowToNotificationMethodRecord(it) },
    )
}
