package org.poweruptime.backend.features.monitor.domain

import org.jetbrains.exposed.v1.core.LessEqOp
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.SqlExpressionBuilder.eq
import org.jetbrains.exposed.v1.core.SqlExpressionBuilder.inList
import org.jetbrains.exposed.v1.core.SqlExpressionBuilder.less
import org.jetbrains.exposed.v1.core.SqlExpressionBuilder.rowNumber
import org.jetbrains.exposed.v1.core.alias
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.core.intLiteral
import org.jetbrains.exposed.v1.core.leftJoin
import org.jetbrains.exposed.v1.core.statements.UpsertSqlExpressionBuilder.inSubQuery
import org.jetbrains.exposed.v1.core.statements.UpsertSqlExpressionBuilder.isNull
import org.jetbrains.exposed.v1.core.statements.UpsertSqlExpressionBuilder.neq
import org.jetbrains.exposed.v1.jdbc.andWhere
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.core.domain.pageQuery
import org.poweruptime.backend.features.monitor.model.CheckResultJoinMonitorAndTeamRecord
import org.poweruptime.backend.features.monitor.model.CheckResultRecord
import org.poweruptime.backend.features.monitor.model.CheckResultTable
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.MonitorTable
import org.poweruptime.backend.features.monitor.model.rowToCheckResultRecord
import org.poweruptime.backend.features.monitor.model.rowToMonitorRecord
import org.poweruptime.backend.features.notification.model.NotificationTable
import org.poweruptime.backend.features.team.model.TeamTable
import org.poweruptime.backend.features.team.model.TeamUserTable
import org.poweruptime.backend.features.team.model.rowToTeamRecord
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant

@Suppress("LongMethod")
fun CheckResultTable.findAll(
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
    require(
        userId != null || monitorId != null || teamId != null,
    ) { "teamId or monitorId or userId needs to be provided" }

    var selectColumns = columns + MonitorTable.columns + TeamTable.columns

    val query = innerJoin(MonitorTable)
        .innerJoin(TeamTable)
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

    statuses?.ifEmpty { null }?.let {
        query.andWhere { CheckResultTable.status inList it }
    }

    if (onlyChanges) {
        query.andWhere { CheckResultTable.status neq CheckResultTable.previousStatus }
    }

    hasNotification?.let {
        query.adjustColumnSet {
            leftJoin(NotificationTable, { CheckResultTable.id }, { NotificationTable.checkResultId })
        }.adjustSelect {
            selectColumns = selectColumns + NotificationTable.id
            select(selectColumns)
        }.andWhere {
            if (it) {
                NotificationTable.id.isNotNull()
            } else {
                NotificationTable.id.isNull()
            }
        }
    }

    start?.let {
        query.andWhere { CheckResultTable.createdAt greaterEq it }
    }

    end?.let {
        query.andWhere { CheckResultTable.createdAt lessEq it }
    }

    if (teamId != null || userId != null) {
        query.andWhere { MonitorTable.deleted.isNull() }
    }

    return pageQuery(
        query,
        pageable,
        sort = {
            when (it) {
                "status" -> CheckResultTable.status
                "pickedUpAt" -> CheckResultTable.pickedUpAt
                "checkedAt" -> CheckResultTable.checkedAt
                "createdAt" -> CheckResultTable.createdAt
                else -> null
            }
        },
        map = {
            CheckResultJoinMonitorAndTeamRecord(
                checkResult = rowToCheckResultRecord(it),
                monitor = MonitorTable.rowToMonitorRecord(it),
                team = TeamTable.rowToTeamRecord(it),
            )
        },
    )
}

fun CheckResultTable.findLastByMonitorId(
    monitorId: ULong,
    limit: Int
): List<CheckResultRecord> = selectAll()
    .where {
        CheckResultTable.monitorId eq monitorId and (CheckResultTable.pickedUpAt.isNotNull())
    }.orderBy(CheckResultTable.createdAt, SortOrder.DESC)
    .limit(limit)
    .map {
        rowToCheckResultRecord(it)
    }

fun CheckResultTable.findLastByMonitorIds(
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

fun CheckResultTable.findByMonitorIdAndPickedUpBetween(
    monitorId: ULong,
    start: Instant,
    end: Instant
): List<CheckResultRecord> = selectAll().where {
    (pickedUpAt greaterEq start) and (pickedUpAt less end) and (CheckResultTable.monitorId eq monitorId)
}.orderBy(pickedUpAt, SortOrder.ASC).map {
    rowToCheckResultRecord(it)
}

fun CheckResultTable.findByStatusUpMonitorIdAndPickedUpBetween(
    monitorId: ULong,
    start: Instant,
    end: Instant
): List<CheckResultRecord> = selectAll().where {
    (status eq MonitorStatus.UP) and
        (pickedUpAt greaterEq start) and
        (pickedUpAt less end) and
        (CheckResultTable.monitorId eq monitorId)
}.orderBy(pickedUpAt, SortOrder.ASC).map {
    rowToCheckResultRecord(it)
}

fun CheckResultTable.deleteByTeamIdAndOlderThan(
    teamId: ULong,
    before: Instant
): Int = deleteWhere {
    CheckResultTable.monitorId inSubQuery (
        MonitorTable.select(MonitorTable.id).where {
            MonitorTable.teamId eq teamId
        }
        ) and (createdAt less before)
}
