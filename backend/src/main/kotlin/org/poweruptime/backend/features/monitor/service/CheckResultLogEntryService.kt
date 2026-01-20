package org.poweruptime.backend.features.monitor.service

import org.jetbrains.exposed.v1.jdbc.insert
import org.poweruptime.backend.features.monitor.domain.deleteByTeamIdAndOlderThan
import org.poweruptime.backend.features.monitor.domain.findAll
import org.poweruptime.backend.features.monitor.model.*
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
@Transactional(readOnly = true)
class CheckResultLogEntryService {
    @Transactional
    fun info(
        stage: CheckResultLogStage,
        checkResultId: ULong,
        message: String,
        properties: Map<String, String>? = null,
    ) {
        save(
            level = CheckResultLogEntryLevel.INFO,
            stage = stage,
            checkResultId = checkResultId,
            message = message,
            properties = properties,
        )
    }

    @Transactional
    fun action(
        stage: CheckResultLogStage,
        checkResultId: ULong,
        message: String,
        properties: Map<String, String>? = null,
    ) {
        save(
            level = CheckResultLogEntryLevel.ACTION,
            stage = stage,
            checkResultId = checkResultId,
            message = message,
            properties = properties,
        )
    }

    @Transactional
    private fun save(
        level: CheckResultLogEntryLevel,
        stage: CheckResultLogStage,
        checkResultId: ULong,
        message: String,
        properties: Map<String, String>? = null,
    ) {
        CheckResultLogEntry.insert {
            it[CheckResultLogEntry.level] = level
            it[CheckResultLogEntry.checkResultId] = checkResultId
            it[CheckResultLogEntry.stage] = stage
            it[CheckResultLogEntry.message] = message
            it[CheckResultLogEntry.properties] = properties
        }
    }

    @Transactional
    fun deleteByTeamIdAndOlderThan(teamId: ULong, than: Instant) =
        CheckResultLogEntry.deleteByTeamIdAndOlderThan(teamId, than)

    fun getAllPaginated(
        checkResultId: ULong,
        stages: List<CheckResultLogStage>? = null,
    ): List<CheckResultLogEntryRecord> = CheckResultLogEntry.findAll(
        checkResultId = checkResultId,
        stages = stages,
    )
}
