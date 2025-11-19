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
import org.poweruptime.backend.features.monitor.model.CheckResult
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.model.Notification
import org.poweruptime.backend.features.notification.model.NotificationMethod
import org.poweruptime.backend.features.notification.model.SubNotification
import org.poweruptime.backend.features.notification.model.SubNotificationJoinMethodAndNotificationRecord
import org.poweruptime.backend.features.notification.model.SubNotificationJoinMethodRecord
import org.poweruptime.backend.features.notification.model.rowToNotificationMethodRecord
import org.poweruptime.backend.features.notification.model.rowToNotificationRecord
import org.poweruptime.backend.features.notification.model.rowToSubNotificationRecord
import org.poweruptime.backend.features.team.model.Team
import org.poweruptime.backend.features.team.model.TeamUser
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant

fun SubNotification.findByNotificationId(
    notificationId: ULong
): List<SubNotificationJoinMethodRecord> =
    innerJoin(NotificationMethod).selectAll().where {
        SubNotification.notificationId eq notificationId
    }.map {
        SubNotificationJoinMethodRecord(
            subNotification = rowToSubNotificationRecord(it),
            method = NotificationMethod.rowToNotificationMethodRecord(it),
        )
    }

fun SubNotification.deleteByTeamIdAndOlderThan(
    teamId: ULong,
    before: Instant
): Int = deleteWhere {
    notificationId inSubQuery (
        Notification
            .innerJoin(CheckResult)
            .innerJoin(Monitor)
            .select(Notification.id)
            .where {
                Monitor.teamId eq teamId
            }
        ) and (createdAt less before)
}

@Suppress("LongMethod")
fun SubNotification.findAll(
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

    var selectColumns = columns + Notification.columns + NotificationMethod.columns

    val query = innerJoin(Notification)
        .innerJoin(NotificationMethod)
        .select(selectColumns)

    notificationId?.let {
        query.andWhere { SubNotification.notificationId eq it }
    }
    teamId?.let {
        query.andWhere { NotificationMethod.teamId eq it }
    }

    if (monitorId != null || statuses?.takeIf { it.isNotEmpty() } != null) {
        query.adjustColumnSet {
            innerJoin(CheckResult)
        }.adjustSelect {
            selectColumns = selectColumns + CheckResult.monitorId + CheckResult.status
            select(selectColumns)
        }
    }

    monitorId?.let {
        query.andWhere { CheckResult.monitorId eq it }
    }

    statuses?.takeIf { it.isNotEmpty() }?.let {
        query.andWhere { CheckResult.status inList it }
    }

    userId?.let {
        query.adjustColumnSet {
            innerJoin(Team)
        }.adjustColumnSet {
            innerJoin(TeamUser)
        }.adjustSelect {
            selectColumns = selectColumns + TeamUser.userId
            select(selectColumns)
        }.andWhere {
            TeamUser.userId eq it
        }
    }

    methods?.takeIf { it.isNotEmpty() }?.let {
        query.andWhere { NotificationMethod.type inList it }
    }

    if (teamId != null || userId != null) {
        query.adjustColumnSet {
            innerJoin(Monitor)
        }.adjustSelect {
            selectColumns = selectColumns + Monitor.deleted
            select(selectColumns)
        }.andWhere {
            Monitor.deleted.isNull()
        }
    }

    return pageQuery(
        query,
        pageable,
        sort = {
            when (it) {
                "notification.checkResult.status" -> CheckResult.status
                "method" -> NotificationMethod.type
                "createdAt" -> SubNotification.createdAt
                else -> null
            }
        },
        map = {
            SubNotificationJoinMethodAndNotificationRecord(
                subNotification = rowToSubNotificationRecord(it),
                notification = Notification.rowToNotificationRecord(it),
                method = NotificationMethod.rowToNotificationMethodRecord(it),
            )
        },
    )
}
