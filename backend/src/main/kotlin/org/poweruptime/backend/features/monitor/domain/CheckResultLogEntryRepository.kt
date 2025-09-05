package org.poweruptime.backend.features.monitor.domain

import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.statements.UpsertSqlExpressionBuilder.eq
import org.jetbrains.exposed.v1.core.statements.UpsertSqlExpressionBuilder.inList
import org.jetbrains.exposed.v1.core.statements.UpsertSqlExpressionBuilder.inSubQuery
import org.jetbrains.exposed.v1.core.statements.UpsertSqlExpressionBuilder.less
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.core.domain.pageQuery
import org.poweruptime.backend.features.monitor.model.CheckResultLogEntryRecord
import org.poweruptime.backend.features.monitor.model.CheckResultLogEntryTable
import org.poweruptime.backend.features.monitor.model.CheckResultLogStage
import org.poweruptime.backend.features.monitor.model.CheckResultTable
import org.poweruptime.backend.features.monitor.model.MonitorTable
import org.poweruptime.backend.features.monitor.model.rowToCheckResultLogEntry
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant

fun CheckResultLogEntryTable.deleteByTeamIdAndOlderThan(
    teamId: ULong,
    before: Instant
): Int =
    deleteWhere {
        checkResultId inSubQuery (
            CheckResultTable.innerJoin(MonitorTable).select(CheckResultTable.id).where {
                MonitorTable.teamId eq teamId
            }
            ) and (CheckResultTable.createdAt less before)
    }

fun CheckResultLogEntryTable.findAll(
    pageable: Pageable,
    checkResultId: ULong,
    stages: List<CheckResultLogStage>? = null,
): Page<CheckResultLogEntryRecord> {
    var condition: Op<Boolean> = (CheckResultLogEntryTable.checkResultId eq checkResultId)

    stages?.ifEmpty { null }?.let {
        condition = condition and (CheckResultLogEntryTable.stage inList it)
    }

    val query = CheckResultLogEntryTable
        .selectAll().where(condition)

    return pageQuery(
        query,
        pageable,
        {
            when (it) {
                "stage" -> CheckResultLogEntryTable.stage
                "level" -> CheckResultLogEntryTable.level
                "createdAt" -> CheckResultLogEntryTable.createdAt
                else -> null
            }
        },
        { rowToCheckResultLogEntry(it) },
    )
}
