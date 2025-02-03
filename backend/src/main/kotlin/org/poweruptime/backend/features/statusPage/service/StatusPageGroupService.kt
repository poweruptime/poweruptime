package org.poweruptime.backend.features.statusPage.service

import jakarta.persistence.criteria.CriteriaBuilder
import jakarta.persistence.criteria.CriteriaQuery
import jakarta.persistence.criteria.Root
import org.poweruptime.backend.core.Filter
import org.poweruptime.backend.core.FilterCompare
import org.poweruptime.backend.core.dto.PageableValidator
import org.poweruptime.backend.core.service.AEntityService
import org.poweruptime.backend.core.toPredicate
import org.poweruptime.backend.features.statusPage.domain.StatusPageGroupRepository
import org.poweruptime.backend.features.statusPage.model.StatusPageGroup
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service

@Service
class StatusPageGroupService(
    private val statusPageGroupRepository: StatusPageGroupRepository,
) : AEntityService<StatusPageGroup>(statusPageGroupRepository) {
    fun getAllPaginated(
        pageable: Pageable,
        statusPageId: String,
        name: String?,
    ): Page<StatusPageGroup> = statusPageGroupRepository.findAll(
        { root: Root<StatusPageGroup>, _: CriteriaQuery<*>?, criteriaBuilder: CriteriaBuilder ->
            fun getStatusPagePredicate() = criteriaBuilder.and(
                *buildList {
                    add(Filter("statusPage.id", statusPageId, FilterCompare.EQ))
                    add(Filter("deleted", null, FilterCompare.IS_NULL))
                }.toPredicate(root, criteriaBuilder).toTypedArray(),
            )

            fun shouldAddFilter() = name != null

            fun getFilterPredicates() = criteriaBuilder.and(
                *buildList {
                    name?.let { add(Filter("name", it, FilterCompare.LIKE)) }
                }.toPredicate(root, criteriaBuilder).toTypedArray(),
            )

            criteriaBuilder.and(
                *buildList {
                    add(getStatusPagePredicate())

                    if (shouldAddFilter()) {
                        add(getFilterPredicates())
                    }
                }.toTypedArray(),
            )
        },
        PageableValidator.validateSort(
            pageable,
            listOf("name", "position", "createdAt", "updatedAt"),
        ),
    )

    fun ensureAllStatusGroupsInTeam(statusPageGroups: List<StatusPageGroup>, teamId: String) =
        statusPageGroups.all { it.statusPage.team.id == teamId }
}
