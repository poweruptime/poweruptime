package org.poweruptime.backend.features.notification.domain

import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greaterEq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.inSubQuery
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.core.isNull
import org.jetbrains.exposed.v1.core.less
import org.jetbrains.exposed.v1.core.lessEq
import org.jetbrains.exposed.v1.jdbc.andWhere
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.select
import org.poweruptime.backend.core.domain.pageQuery
import org.poweruptime.backend.features.monitor.model.CheckResultTable
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.MonitorTable
import org.poweruptime.backend.features.monitor.model.rowToCheckResultRecord
import org.poweruptime.backend.features.monitor.model.rowToMonitorRecord
import org.poweruptime.backend.features.notification.model.NotificationJoinCheckResultMonitorAndTeamRecord
import org.poweruptime.backend.features.notification.model.NotificationTable
import org.poweruptime.backend.features.notification.model.rowToNotificationRecord
import org.poweruptime.backend.features.team.model.TeamTable
import org.poweruptime.backend.features.team.model.TeamUserTable
import org.poweruptime.backend.features.team.model.rowToTeamRecord
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant

fun NotificationTable.deleteByTeamIdAndOlderThan(
    teamId: ULong,
    before: Instant
): Int = deleteWhere {
    NotificationTable.checkResultId inSubQuery (
        CheckResultTable.innerJoin(MonitorTable).select(CheckResultTable.id).where {
            MonitorTable.teamId eq teamId
        }
        ) and (createdAt less before)
}

@Suppress("LongMethod")
fun NotificationTable.findAll(
    pageable: Pageable,
    monitorId: ULong?,
    teamId: ULong?,
    userId: ULong?,
    statuses: List<MonitorStatus>?,
    start: Instant?,
    end: Instant?,
): Page<NotificationJoinCheckResultMonitorAndTeamRecord> {
    require(userId != null || teamId != null || monitorId !== null) {
        "teamId or monitorId or userId needs to be provided"
    }

    var selectColumns = columns + CheckResultTable.columns + MonitorTable.columns + TeamTable.columns

    val query = innerJoin(CheckResultTable)
        .innerJoin(MonitorTable)
        .innerJoin(TeamTable, { MonitorTable.teamId }, { TeamTable.id })
        .select(selectColumns)

    teamId?.let {
        query.andWhere { TeamTable.id eq teamId }
    }

    monitorId?.let {
        query.andWhere { MonitorTable.id eq monitorId }
    }

    userId?.let {
        query.adjustColumnSet {
            innerJoin(TeamUserTable)
        }.adjustSelect {
            selectColumns = selectColumns + TeamUserTable.userId
            select(selectColumns)
        }.andWhere { TeamUserTable.userId eq userId }
    }

    statuses?.takeIf { it.isNotEmpty() }?.let {
        query.andWhere { CheckResultTable.status inList it }
    }

    start?.let {
        query.andWhere { NotificationTable.createdAt greaterEq it }
    }

    end?.let {
        query.andWhere { NotificationTable.createdAt lessEq it }
    }

    if (teamId != null || userId != null) {
        query.andWhere { MonitorTable.deleted.isNull() }
    }

    return pageQuery(
        query,
        pageable,
        sort = {
            when (it) {
                "checkResult.status" -> CheckResultTable.status
                "createdAt" -> NotificationTable.createdAt
                else -> null
            }
        },
        map = {
            NotificationJoinCheckResultMonitorAndTeamRecord(
                notification = rowToNotificationRecord(it),
                checkResult = CheckResultTable.rowToCheckResultRecord(it),
                monitor = MonitorTable.rowToMonitorRecord(it),
                team = TeamTable.rowToTeamRecord(it),
            )
        },
    )
}
