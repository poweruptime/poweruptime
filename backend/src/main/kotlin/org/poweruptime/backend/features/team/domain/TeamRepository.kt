package org.poweruptime.backend.features.team.domain

import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.like
import org.jetbrains.exposed.v1.core.lowerCase
import org.jetbrains.exposed.v1.jdbc.andWhere
import org.jetbrains.exposed.v1.jdbc.select
import org.poweruptime.backend.core.domain.deletedFilter
import org.poweruptime.backend.core.domain.pageQuery
import org.poweruptime.backend.features.team.model.Team
import org.poweruptime.backend.features.team.model.TeamRecord
import org.poweruptime.backend.features.team.model.TeamRole
import org.poweruptime.backend.features.team.model.TeamUser
import org.poweruptime.backend.features.team.model.rowToTeamRecord
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import kotlin.collections.plus

fun Team.findAll(
    pageable: Pageable,
    userId: ULong?,
    name: String?,
    role: TeamRole?,
    deleted: Boolean = false,
): Page<TeamRecord> {
    var selectColumns = columns

    val query = select(selectColumns).where { Team.deleted.deletedFilter(deleted) }

    userId?.let {
        query.adjustColumnSet {
            innerJoin(TeamUser)
        }.adjustSelect {
            selectColumns = selectColumns + TeamUser.userId
            select(selectColumns)
        }.andWhere { TeamUser.userId eq it }
    }

    if (userId != null && role != null) {
        query.andWhere { TeamUser.role eq role }
    }

    name?.takeIf { it.isNotEmpty() }?.let {
        query.andWhere { (Team.name.lowerCase() like "%${it.lowercase()}%") }
    }

    return pageQuery(
        query,
        pageable,
        sort = {
            when (it) {
                "name" -> Team.name
                "personalUser.id" -> Team.personalUserId
                "createdAt" -> Team.createdAt
                else -> null
            }
        },
        map = { rowToTeamRecord(it) },
    )
}
