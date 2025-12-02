package org.poweruptime.backend.features.monitor.domain

import org.jetbrains.exposed.v1.core.LessEqOp
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.alias
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greaterEq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.inSubQuery
import org.jetbrains.exposed.v1.core.intLiteral
import org.jetbrains.exposed.v1.core.isNotNull
import org.jetbrains.exposed.v1.core.isNull
import org.jetbrains.exposed.v1.core.leftJoin
import org.jetbrains.exposed.v1.core.less
import org.jetbrains.exposed.v1.core.lessEq
import org.jetbrains.exposed.v1.core.neq
import org.jetbrains.exposed.v1.core.rowNumber
import org.jetbrains.exposed.v1.jdbc.andWhere
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.core.domain.Page
import org.poweruptime.backend.core.domain.pageQuery
import org.poweruptime.backend.core.dto.Pageable
import org.poweruptime.backend.features.monitor.model.CheckResult
import org.poweruptime.backend.features.monitor.model.CheckResultJoinMonitorAndTeamRecord
import org.poweruptime.backend.features.monitor.model.CheckResultRecord
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.rowToCheckResultRecord
import org.poweruptime.backend.features.monitor.model.rowToMonitorRecord
import org.poweruptime.backend.features.notification.model.Notification
import org.poweruptime.backend.features.team.model.Team
import org.poweruptime.backend.features.team.model.TeamUser
import org.poweruptime.backend.features.team.model.rowToTeamRecord
import java.time.Instant
import javax.naming.directory.InvalidAttributesException

@Suppress("LongMethod")
fun CheckResult.findAll(
    pageable: Pageable,
    onlyChanges: Boolean,
    monitorId: ULong?,
    teamId: ULong?,
    userId: ULong?,
    statuses: List<MonitorStatus>?,
    hasNotification: Boolean?,
    start: Instant?,
    end: Instant?,
): Page<CheckResultJoinMonitorAndTeamRecord> {
    var selectColumns = columns + Monitor.columns + Team.columns

    val query = when {
        monitorId != null -> {
            innerJoin(Monitor).innerJoin(Team).select(selectColumns)
        }
        teamId != null -> {
            Team.innerJoin(Monitor).innerJoin(CheckResult)
                .select(selectColumns)
        }
        userId != null -> {
            selectColumns = selectColumns + TeamUser.userId
            TeamUser.innerJoin(Team).innerJoin(Monitor)
                .innerJoin(CheckResult).select(selectColumns)
        }
        else -> error("teamId or monitorId or userId needs to be provided")
    }

    when {
        monitorId != null -> query.andWhere { Monitor.id eq monitorId }
        teamId != null -> query.andWhere { Team.id eq teamId }
        userId != null -> query.andWhere { TeamUser.userId eq userId }
    }

    statuses?.ifEmpty { null }?.let {
        query.andWhere { CheckResult.status inList it }
    }

    if (onlyChanges) {
        query.andWhere { CheckResult.status neq CheckResult.previousStatus }
    }

    hasNotification?.let {
        query.adjustColumnSet {
            leftJoin(Notification, { CheckResult.id }, { Notification.checkResultId })
        }.adjustSelect {
            selectColumns = selectColumns + Notification.id
            select(selectColumns)
        }.andWhere {
            if (it) Notification.id.isNotNull() else Notification.id.isNull()
        }
    }

    start?.let { query.andWhere { CheckResult.createdAt greaterEq it } }
    end?.let { query.andWhere { CheckResult.createdAt lessEq it } }

    if (teamId != null || userId != null) {
        query.andWhere { Monitor.deleted.isNull() }
    }

    return pageQuery(
        query,
        pageable,
        sort = {
            when (it) {
                "status" -> CheckResult.status
                "pickedUpAt" -> CheckResult.pickedUpAt
                "checkedAt" -> CheckResult.checkedAt
                "createdAt" -> CheckResult.createdAt
                else -> null
            }
        },
        map = {
            CheckResultJoinMonitorAndTeamRecord(
                checkResult = rowToCheckResultRecord(it),
                monitor = Monitor.rowToMonitorRecord(it),
                team = Team.rowToTeamRecord(it),
            )
        },
    )
}

fun CheckResult.findLastByMonitorId(
    monitorId: ULong,
    limit: Int
): List<CheckResultRecord> = selectAll()
    .where {
        CheckResult.monitorId eq monitorId and (pickedUpAt.isNotNull())
    }.orderBy(createdAt, SortOrder.DESC)
    .limit(limit)
    .map {
        rowToCheckResultRecord(it)
    }

fun CheckResult.findLastByMonitorIds(
    monitorIds: List<ULong>,
    limit: Int
): List<CheckResultRecord> {
    val rn = rowNumber().over()
        .partitionBy(monitorId)
        .orderBy(createdAt, SortOrder.DESC)
        .alias("rn")

    val ranked = select(columns + rn)
        .where {
            (monitorId inList monitorIds) and
                (pickedUpAt.isNotNull())
        }
        .alias("ranked")

    return ranked
        .select(ranked.columns)
        .where {
            LessEqOp(ranked[rn], intLiteral(limit))
        }
        .orderBy(
            ranked[monitorId] to SortOrder.ASC,
            ranked[createdAt] to SortOrder.DESC,
        )
        .map {
            rowToCheckResultRecord(it, ranked)
        }
}

fun CheckResult.findByMonitorIdAndPickedUpBetween(
    monitorId: ULong,
    start: Instant,
    end: Instant
): List<CheckResultRecord> = selectAll().where {
    (pickedUpAt greaterEq start) and (pickedUpAt less end) and (CheckResult.monitorId eq monitorId)
}.orderBy(pickedUpAt, SortOrder.ASC).map {
    rowToCheckResultRecord(it)
}

fun CheckResult.findLastOppositeByMonitorIdAndStatus(
    monitorId: ULong,
    status: MonitorStatus,
): CheckResultRecord? = selectAll().where {
    (
        CheckResult.status eq when (status) {
            MonitorStatus.UP -> MonitorStatus.DOWN
            MonitorStatus.DOWN -> MonitorStatus.UP
            else -> throw InvalidAttributesException(
                "Check result status not allowed to be $status",
            )
        }
        ) and (CheckResult.monitorId eq monitorId) and (CheckResult.status neq CheckResult.previousStatus)
}.orderBy(createdAt, SortOrder.DESC_NULLS_LAST)
    .limit(1)
    .firstOrNull()
    ?.let {
        rowToCheckResultRecord(it)
    }

fun CheckResult.findByStatusUpMonitorIdAndPickedUpBetween(
    monitorId: ULong,
    start: Instant,
    end: Instant
): List<CheckResultRecord> = selectAll().where {
    (status eq MonitorStatus.UP) and
        (pickedUpAt greaterEq start) and
        (pickedUpAt less end) and
        (CheckResult.monitorId eq monitorId)
}.orderBy(pickedUpAt, SortOrder.ASC).map {
    rowToCheckResultRecord(it)
}

fun CheckResult.deleteByTeamIdAndOlderThan(
    teamId: ULong,
    before: Instant
): Int = deleteWhere {
    CheckResult.monitorId inSubQuery (
        Monitor.select(Monitor.id).where {
            Monitor.teamId eq teamId
        }
        ) and (createdAt less before)
}
