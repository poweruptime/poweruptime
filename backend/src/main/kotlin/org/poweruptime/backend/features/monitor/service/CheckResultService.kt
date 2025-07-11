package org.poweruptime.backend.features.monitor.service

import jakarta.persistence.criteria.CriteriaBuilder
import jakarta.persistence.criteria.CriteriaQuery
import jakarta.persistence.criteria.Root
import org.poweruptime.backend.core.Filter
import org.poweruptime.backend.core.FilterCompare
import org.poweruptime.backend.core.dto.PageableValidator
import org.poweruptime.backend.core.service.AEntityService
import org.poweruptime.backend.core.toPredicate
import org.poweruptime.backend.features.monitor.domain.CheckResultRepository
import org.poweruptime.backend.features.monitor.model.CheckResult
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class CheckResultService(
    private val checkResultRepository: CheckResultRepository
) : AEntityService<CheckResult>(checkResultRepository) {
    fun deleteByTeamIdAndOlderThan(teamId: String, than: Instant) = checkResultRepository.findByTeamIdAndOlderThan(
        teamId,
        than,
    ).apply {
        deleteAll(this)
    }

    fun getAllPaginated(
        pageable: Pageable,
        onlyChanges: Boolean,
        monitorId: String?,
        teamId: String?,
        userId: String?,
        statuses: List<MonitorStatus>?,
    ): Page<CheckResult> = checkResultRepository.findAll(
        { root: Root<CheckResult>, query: CriteriaQuery<*>?, criteriaBuilder: CriteriaBuilder ->
            assert(
                (userId !== null && teamId == null && monitorId == null) ||
                    (userId === null && teamId != null && monitorId == null) ||
                    (userId === null && teamId == null && monitorId != null),
            )

            query?.distinct(true)

            val idPredicate = when {
                teamId != null -> Filter("monitor.team.id", teamId, FilterCompare.EQ)
                monitorId != null -> Filter("monitor.id", monitorId, FilterCompare.EQ)
                userId != null -> Filter("monitor.team.teamUsers.id.user.id", userId, FilterCompare.EQ)
                else -> throw AssertionError("teamId or monitorId or userId needs to be provided")
            }.toPredicate(root, criteriaBuilder)

            val filterPredicates = if (onlyChanges || !statuses.isNullOrEmpty() || teamId != null || userId != null) {
                criteriaBuilder.and(
                    *buildList {
                        statuses?.let { add(Filter("status", it, FilterCompare.IN)) }
                        if (onlyChanges) {
                            add(Filter("status", "previousStatus", FilterCompare.NOT_EQUAL_TO))
                        }
                        if (teamId != null || userId != null) {
                            add(Filter("monitor.deleted", "", FilterCompare.IS_NULL))
                        }
                    }.toPredicate(root, criteriaBuilder).toTypedArray(),
                )
            } else {
                null
            }

            if (filterPredicates != null) {
                criteriaBuilder.and(idPredicate, filterPredicates)
            } else {
                idPredicate
            }
        },
        PageableValidator.validateSort(
            pageable,
            listOf("status", "pickedUpAt", "checkedAt", "createdAt"),
        ),
    )
}
