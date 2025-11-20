package org.poweruptime.backend.features.notification.domain

import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.like
import org.jetbrains.exposed.v1.core.lowerCase
import org.jetbrains.exposed.v1.jdbc.andWhere
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.core.domain.deletedFilter
import org.poweruptime.backend.core.domain.pageQuery
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.model.MonitorNotificationMethod
import org.poweruptime.backend.features.notification.model.NotificationMethod
import org.poweruptime.backend.features.notification.model.NotificationMethodRecord
import org.poweruptime.backend.features.notification.model.rowToNotificationMethodRecord
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

fun NotificationMethod.findByMonitorId(
    monitorId: ULong
): List<NotificationMethodRecord> = innerJoin(MonitorNotificationMethod).selectAll().where {
    MonitorNotificationMethod.monitorId eq monitorId
}.map {
    rowToNotificationMethodRecord(it)
}

fun NotificationMethod.findAll(
    pageable: Pageable,
    teamId: ULong,
    name: String?,
    types: List<NotificationMethodType>?,
    useByDefault: Boolean?,
    deleted: Boolean = false,
): Page<NotificationMethodRecord> {
    val query = selectAll()

    query.andWhere { NotificationMethod.deleted.deletedFilter(deleted) }
    query.andWhere { NotificationMethod.teamId eq teamId }

    name?.takeIf { it.isNotEmpty() }?.let {
        query.andWhere { NotificationMethod.name.lowerCase() like "%${it.lowercase()}%" }
    }

    types?.takeIf { it.isNotEmpty() }?.let {
        query.andWhere { NotificationMethod.type inList it }
    }

    useByDefault?.let {
        query.andWhere { NotificationMethod.useByDefault eq it }
    }

    return pageQuery(
        query,
        pageable,
        sort = {
            when (it) {
                "name" -> NotificationMethod.name
                "useByDefault" -> NotificationMethod.useByDefault
                "type" -> NotificationMethod.type
                "createdAt" -> NotificationMethod.createdAt
                "deleted" -> NotificationMethod.deleted
                else -> null
            }
        },
        map = { rowToNotificationMethodRecord(it) },
    )
}
