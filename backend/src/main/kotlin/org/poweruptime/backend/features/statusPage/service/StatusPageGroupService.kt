package org.poweruptime.backend.features.statusPage.service

import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.core.domain.findIdsByPublicIdsOrThrow
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupTable
import org.poweruptime.backend.features.statusPage.model.StatusPageTable
import org.springframework.stereotype.Service

@Service
class StatusPageGroupService {
    fun getIdsByPublicIds(publicIds: List<String>): List<ULong> = StatusPageGroupTable.findIdsByPublicIdsOrThrow(
        publicIds,
    )

    fun ensureAllStatusGroupsInTeam(statusPageGroupIds: List<ULong>, teamId: ULong): Boolean =
        StatusPageGroupTable.innerJoin(StatusPageTable).selectAll().where {
            (StatusPageTable.teamId eq teamId) and (StatusPageGroupTable.id inList statusPageGroupIds)
        }.count() == statusPageGroupIds.size.toLong()
}
