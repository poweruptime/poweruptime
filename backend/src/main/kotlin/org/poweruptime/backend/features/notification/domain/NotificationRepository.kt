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
import org.poweruptime.backend.features.monitor.model.CheckResult
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.rowToCheckResultRecord
import org.poweruptime.backend.features.monitor.model.rowToMonitorRecord
import org.poweruptime.backend.features.notification.model.Notification
import org.poweruptime.backend.features.notification.model.NotificationJoinCheckResultMonitorAndTeamRecord
import org.poweruptime.backend.features.notification.model.rowToNotificationRecord
import org.poweruptime.backend.features.team.model.Team
import org.poweruptime.backend.features.team.model.TeamUser
import org.poweruptime.backend.features.team.model.rowToTeamRecord
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant

fun Notification.deleteByTeamIdAndOlderThan(
    teamId: ULong,
    before: Instant
): Int = deleteWhere {
    Notification.checkResultId inSubQuery (
        CheckResult.innerJoin(Monitor).select(CheckResult.id).where {
            Monitor.teamId eq teamId
        }
        ) and (createdAt less before)
}

@Suppress("LongMethod")
fun Notification.findAll(
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

    var selectColumns = columns + CheckResult.columns + Monitor.columns + Team.columns

    val query = innerJoin(CheckResult)
        .innerJoin(Monitor)
        .innerJoin(Team, { Monitor.teamId }, { Team.id })
        .select(selectColumns)

    teamId?.let {
        query.andWhere { Team.id eq teamId }
    }

    monitorId?.let {
        query.andWhere { Monitor.id eq monitorId }
    }

    userId?.let {
        query.adjustColumnSet {
            innerJoin(TeamUser)
        }.adjustSelect {
            selectColumns = selectColumns + TeamUser.userId
            select(selectColumns)
        }.andWhere { TeamUser.userId eq userId }
    }

    statuses?.takeIf { it.isNotEmpty() }?.let {
        query.andWhere { CheckResult.status inList it }
    }

    start?.let {
        query.andWhere { Notification.createdAt greaterEq it }
    }

    end?.let {
        query.andWhere { Notification.createdAt lessEq it }
    }

    if (teamId != null || userId != null) {
        query.andWhere { Monitor.deleted.isNull() }
    }

    return pageQuery(
        query,
        pageable,
        sort = {
            when (it) {
                "checkResult.status" -> CheckResult.status
                "createdAt" -> Notification.createdAt
                else -> null
            }
        },
        map = {
            NotificationJoinCheckResultMonitorAndTeamRecord(
                notification = rowToNotificationRecord(it),
                checkResult = CheckResult.rowToCheckResultRecord(it),
                monitor = Monitor.rowToMonitorRecord(it),
                team = Team.rowToTeamRecord(it),
            )
        },
    )
}
