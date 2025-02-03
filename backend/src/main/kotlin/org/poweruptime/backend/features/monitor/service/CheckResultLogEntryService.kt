package org.poweruptime.backend.features.monitor.service

import jakarta.persistence.criteria.CriteriaBuilder
import jakarta.persistence.criteria.CriteriaQuery
import jakarta.persistence.criteria.Root
import org.poweruptime.backend.core.Filter
import org.poweruptime.backend.core.FilterCompare
import org.poweruptime.backend.core.dto.PageableValidator
import org.poweruptime.backend.core.service.AEntityService
import org.poweruptime.backend.core.toPredicate
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
    ): Page<CheckResultLogEntry> = checkResultLogEntryRepository.findAll(
        { root: Root<CheckResultLogEntry>, query: CriteriaQuery<*>?, criteriaBuilder: CriteriaBuilder ->
            query?.distinct(true)

            Filter("checkResult.id", checkResultId, FilterCompare.EQ).toPredicate(root, criteriaBuilder)
        },
        PageableValidator.validateSort(
            pageable,
            listOf("stage", "level", "createdAt"),
        ),
    )
}
