package org.poweruptime.backend.features.tag

import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.SqlExpressionBuilder.eq
import org.jetbrains.exposed.v1.core.SqlExpressionBuilder.like
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.core.lowerCase
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.core.domain.deletedFilter
import org.poweruptime.backend.core.domain.pageQuery
import org.poweruptime.backend.features.team.model.TeamTable
import org.poweruptime.backend.features.team.model.TeamUserTable
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

fun TagTable.findByTeamIdAndNames(teamId: ULong, names: List<String>): List<TagRecord> =
    selectAll().where { (TagTable.teamId eq teamId) and (TagTable.name inList names) }.map {
        TagTable.rowToTagRecord(it)
    }

fun TagTable.findByMonitorId(monitorIds: List<ULong>): List<TagJoinMonitorRecord> =
    innerJoin(MonitorTagTable, { TagTable.id }, { MonitorTagTable.tagId })
        .selectAll()
        .where { MonitorTagTable.monitorId inList monitorIds }
        .map {
            TagJoinMonitorRecord(
                tag = TagTable.rowToTagRecord(it),
                monitorTag = MonitorTagTable.rowToMonitorTagRecord(it),
            )
        }

fun TagTable.findByMonitorId(monitorId: ULong): List<TagRecord> =
    innerJoin(MonitorTagTable, { TagTable.id }, { MonitorTagTable.tagId })
        .selectAll()
        .where { MonitorTagTable.monitorId eq monitorId }
        .map {
            TagTable.rowToTagRecord(it)
        }

fun TagTable.findAll(
    pageable: Pageable,
    teamId: ULong?,
    userId: ULong?,
    name: String?,
    deleted: Boolean = false,
): Page<TagRecord> {
    require(teamId != null || userId != null) { "teamId or userId needs to be provided" }

    var condition: Op<Boolean> = TagTable.deleted.deletedFilter(deleted)

    teamId?.let {
        condition = condition and (TagTable.teamId eq it)
    }

    userId?.let {
        condition = condition and (TeamUserTable.userId eq it)
    }

    name?.let {
        condition = condition and (TagTable.name.lowerCase() like "%${it.lowercase()}%")
    }

    val query = innerJoin(TeamTable).innerJoin(TeamUserTable).selectAll().where(condition)

    return pageQuery(
        query,
        pageable,
        sort = {
            when (it) {
                "name" -> TagTable.name
                "variant" -> TagTable.variant
                else -> null
            }
        },
        map = { rowToTagRecord(it) },
    )
}
