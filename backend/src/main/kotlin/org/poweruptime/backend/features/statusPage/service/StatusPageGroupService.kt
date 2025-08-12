package org.poweruptime.backend.features.statusPage.service

import me.dafnik.JpaSpecificationBuilder.buildSpecification
import org.poweruptime.backend.core.dto.validateSort
import org.poweruptime.backend.core.service.AEntityService
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
        buildSpecification {
            where {
                and {
                    col("statusPage.id") eq statusPageId
                    col("deleted").isNull()
                    name?.let { col("name") lowercaseLike "%$it%" }
                }
            }
        },
        pageable.validateSort("name", "position", "createdAt", "updatedAt"),
    )

    fun ensureAllStatusGroupsInTeam(statusPageGroups: List<StatusPageGroup>, teamId: String) =
        statusPageGroups.all { it.statusPage.team.id == teamId }
}
