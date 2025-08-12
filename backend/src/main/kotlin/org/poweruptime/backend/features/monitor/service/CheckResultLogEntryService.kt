package org.poweruptime.backend.features.monitor.service

import me.dafnik.JpaSpecificationBuilder.buildSpecification
import org.poweruptime.backend.core.dto.validateSort
import org.poweruptime.backend.core.service.AEntityService
import org.poweruptime.backend.features.monitor.domain.CheckResultLogEntryRepository
import org.poweruptime.backend.features.monitor.model.*
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class CheckResultLogEntryService(
    private val checkResultLogEntryRepository: CheckResultLogEntryRepository,
) : AEntityService<CheckResultLogEntry>(checkResultLogEntryRepository) {
    fun info(
        stage: CheckResultLogStage,
        checkResult: CheckResult,
        message: String,
        properties: Map<String, String>? = null
    ) {
        save(
            CheckResultLogEntry(
                stage = stage,
                level = CheckResultLogEntryLevel.INFO,
                checkResult = checkResult,
                message = message,
                properties = properties,
            ),
        )
    }

    fun action(
        stage: CheckResultLogStage,
        checkResult: CheckResult,
        message: String,
        properties: Map<String, String>? = null
    ) {
        save(
            CheckResultLogEntry(
                stage = stage,
                level = CheckResultLogEntryLevel.ACTION,
                checkResult = checkResult,
                message = message,
                properties = properties,
            ),
        )
    }

    fun deleteByTeamIdAndOlderThan(teamId: String, than: Instant) =
        checkResultLogEntryRepository.findByTeamIdAndOlderThan(
            teamId,
            than,
        ).apply {
            deleteAll(this)
        }

    fun getAllPaginated(
        pageable: Pageable,
        checkResultId: String,
        stages: List<CheckResultLogStage>? = null,
    ): Page<CheckResultLogEntry> = checkResultLogEntryRepository.findAll(
        buildSpecification {
            distinct = true

            where {
                and {
                    col("checkResult.id") eq checkResultId
                    stages?.ifEmpty { null }?.let { col(CheckResultLogEntry::stage) inList it }
                }
            }
        },
        pageable.validateSort("stage", "level", "createdAt"),
    )
}
