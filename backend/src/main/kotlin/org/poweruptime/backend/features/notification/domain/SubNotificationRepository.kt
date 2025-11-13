package org.poweruptime.backend.features.notification.domain

import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.inSubQuery
import org.jetbrains.exposed.v1.core.isNull
import org.jetbrains.exposed.v1.core.less
import org.jetbrains.exposed.v1.jdbc.andWhere
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.core.domain.pageQuery
import org.poweruptime.backend.features.monitor.model.CheckResultTable
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.MonitorTable
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.model.NotificationMethodTable
import org.poweruptime.backend.features.notification.model.NotificationTable
import org.poweruptime.backend.features.notification.model.SubNotificationJoinMethodAndNotificationRecord
import org.poweruptime.backend.features.notification.model.SubNotificationJoinMethodRecord
import org.poweruptime.backend.features.notification.model.SubNotificationTable
import org.poweruptime.backend.features.notification.model.rowToNotificationMethodRecord
import org.poweruptime.backend.features.notification.model.rowToNotificationRecord
import org.poweruptime.backend.features.notification.model.rowToSubNotificationRecord
import org.poweruptime.backend.features.team.model.TeamTable
import org.poweruptime.backend.features.team.model.TeamUserTable
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant

fun SubNotificationTable.findByNotificationId(
    notificationId: ULong
): List<SubNotificationJoinMethodRecord> =
    innerJoin(NotificationMethodTable).selectAll().where {
        SubNotificationTable.notificationId eq notificationId
    }.map {
        SubNotificationJoinMethodRecord(
            subNotification = rowToSubNotificationRecord(it),
            method = NotificationMethodTable.rowToNotificationMethodRecord(it),
        )
    }

fun SubNotificationTable.deleteByTeamIdAndOlderThan(
    teamId: ULong,
    before: Instant
): Int = deleteWhere {
    SubNotificationTable.notificationId inSubQuery (
        NotificationTable
            .innerJoin(CheckResultTable)
            .innerJoin(MonitorTable)
            .select(NotificationTable.id)
            .where {
                MonitorTable.teamId eq teamId
            }
        ) and (createdAt less before)
}

@Suppress("LongMethod")
fun SubNotificationTable.findAll(
    pageable: Pageable,
    notificationId: ULong?,
    monitorId: ULong?,
    teamId: ULong?,
    userId: ULong?,
    methods: List<NotificationMethodType>?,
    statuses: List<MonitorStatus>?,
): Page<SubNotificationJoinMethodAndNotificationRecord> {
    require(userId != null || teamId != null || monitorId !== null || notificationId != null) {
        "notificationId or teamId or monitorId or userId needs to be provided"
    }

    var selectColumns = columns + NotificationTable.columns + NotificationMethodTable.columns

    val query = innerJoin(NotificationTable)
        .innerJoin(NotificationMethodTable)
        .select(selectColumns)

    notificationId?.let {
        query.andWhere { SubNotificationTable.notificationId eq it }
    }
    teamId?.let {
        query.andWhere { NotificationMethodTable.teamId eq it }
    }

    if (monitorId != null || statuses?.takeIf { it.isNotEmpty() } != null) {
        query.adjustColumnSet {
            innerJoin(CheckResultTable)
        }.adjustSelect {
            selectColumns = selectColumns + CheckResultTable.monitorId + CheckResultTable.status
            select(selectColumns)
        }
    }

    monitorId?.let {
        query.andWhere { CheckResultTable.monitorId eq it }
    }

    statuses?.takeIf { it.isNotEmpty() }?.let {
        query.andWhere { CheckResultTable.status inList it }
    }

    userId?.let {
        query.adjustColumnSet {
            innerJoin(TeamTable)
        }.adjustColumnSet {
            innerJoin(TeamUserTable)
        }.adjustSelect {
            selectColumns = selectColumns + TeamUserTable.userId
            select(selectColumns)
        }.andWhere {
            TeamUserTable.userId eq it
        }
    }

    methods?.takeIf { it.isNotEmpty() }?.let {
        query.andWhere { NotificationMethodTable.type inList it }
    }

    if (teamId != null || userId != null) {
        query.adjustColumnSet {
            innerJoin(MonitorTable)
        }.adjustSelect {
            selectColumns = selectColumns + MonitorTable.deleted
            select(selectColumns)
        }.andWhere {
            MonitorTable.deleted.isNull()
        }
    }

    return pageQuery(
        query,
        pageable,
        sort = {
            when (it) {
                "notification.checkResult.status" -> CheckResultTable.status
                "method" -> NotificationMethodTable.type
                "createdAt" -> SubNotificationTable.createdAt
                else -> null
            }
        },
        map = {
            SubNotificationJoinMethodAndNotificationRecord(
                subNotification = rowToSubNotificationRecord(it),
                notification = NotificationTable.rowToNotificationRecord(it),
                method = NotificationMethodTable.rowToNotificationMethodRecord(it),
            )
        },
    )
}
