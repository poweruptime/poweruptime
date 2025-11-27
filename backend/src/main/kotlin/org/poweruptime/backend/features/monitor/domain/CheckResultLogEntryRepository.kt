package org.poweruptime.backend.features.monitor.domain

import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.inSubQuery
import org.jetbrains.exposed.v1.core.less
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.core.domain.Page
import org.poweruptime.backend.core.domain.pageQuery
import org.poweruptime.backend.core.dto.Pageable
import org.poweruptime.backend.features.monitor.model.CheckResult
import org.poweruptime.backend.features.monitor.model.CheckResultLogEntry
import org.poweruptime.backend.features.monitor.model.CheckResultLogEntryRecord
import org.poweruptime.backend.features.monitor.model.CheckResultLogStage
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.rowToCheckResultLogEntry
import java.time.Instant

fun CheckResultLogEntry.deleteByTeamIdAndOlderThan(
    teamId: ULong,
    before: Instant
): Int =
    deleteWhere {
        checkResultId inSubQuery (
            CheckResult.innerJoin(Monitor).select(CheckResult.id).where {
                Monitor.teamId eq teamId
            }
            ) and (CheckResult.createdAt less before)
    }

fun CheckResultLogEntry.findAll(
    pageable: Pageable,
    checkResultId: ULong,
    stages: List<CheckResultLogStage>? = null,
): Page<CheckResultLogEntryRecord> {
    var condition: Op<Boolean> = (CheckResultLogEntry.checkResultId eq checkResultId)

    stages?.ifEmpty { null }?.let {
        condition = condition and (CheckResultLogEntry.stage inList it)
    }

    val query = selectAll().where(condition)

    return pageQuery(
        query,
        pageable,
        {
            when (it) {
                "stage" -> CheckResultLogEntry.stage
                "level" -> CheckResultLogEntry.level
                "createdAt" -> CheckResultLogEntry.createdAt
                else -> null
            }
        },
        { rowToCheckResultLogEntry(it) },
    )
}
