package org.poweruptime.backend.features.statusPage.service

import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.core.domain.findIdsByPublicIdsOrThrow
import org.poweruptime.backend.features.statusPage.model.StatusPage
import org.poweruptime.backend.features.statusPage.model.StatusPageGroup
import org.springframework.stereotype.Service

@Service
class StatusPageGroupService {
    fun getIdsByPublicIds(publicIds: List<String>): List<ULong> = StatusPageGroup.findIdsByPublicIdsOrThrow(
        publicIds,
    )

    fun ensureAllStatusGroupsInTeam(statusPageGroupIds: List<ULong>, teamId: ULong): Boolean =
        StatusPageGroup.innerJoin(StatusPage).selectAll().where {
            (StatusPage.teamId eq teamId) and (StatusPageGroup.id inList statusPageGroupIds)
        }.count() == statusPageGroupIds.size.toLong()
}
