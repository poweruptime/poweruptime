package org.poweruptime.backend.features.team.domain

import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.like
import org.jetbrains.exposed.v1.core.lowerCase
import org.jetbrains.exposed.v1.jdbc.andWhere
import org.jetbrains.exposed.v1.jdbc.select
import org.poweruptime.backend.core.domain.deletedFilter
import org.poweruptime.backend.core.domain.pageQuery
import org.poweruptime.backend.features.team.model.TeamRecord
import org.poweruptime.backend.features.team.model.TeamRole
import org.poweruptime.backend.features.team.model.TeamTable
import org.poweruptime.backend.features.team.model.TeamUserTable
import org.poweruptime.backend.features.team.model.rowToTeamRecord
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import kotlin.collections.plus

fun TeamTable.findAll(
    pageable: Pageable,
    userId: ULong?,
    name: String?,
    role: TeamRole?,
    deleted: Boolean = false,
): Page<TeamRecord> {
    var selectColumns = columns

    val query = select(selectColumns).where { TeamTable.deleted.deletedFilter(deleted) }

    userId?.let {
        query.adjustColumnSet {
            innerJoin(TeamUserTable)
        }.adjustSelect {
            selectColumns = selectColumns + TeamUserTable.userId
            select(selectColumns)
        }.andWhere { TeamUserTable.userId eq it }
    }

    if (userId != null && role != null) {
        query.andWhere { TeamUserTable.role eq role }
    }

    name?.takeIf { it.isNotEmpty() }?.let {
        query.andWhere { (TeamTable.name.lowerCase() like "%${it.lowercase()}%") }
    }

    return pageQuery(
        query,
        pageable,
        sort = {
            when (it) {
                "name" -> TeamTable.name
                "personalUser.id" -> TeamTable.personalUserId
                "createdAt" -> TeamTable.createdAt
                else -> null
            }
        },
        map = { rowToTeamRecord(it) },
    )
}
