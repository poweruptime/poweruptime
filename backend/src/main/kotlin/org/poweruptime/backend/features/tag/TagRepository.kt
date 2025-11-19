package org.poweruptime.backend.features.tag

import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.core.like
import org.jetbrains.exposed.v1.core.lowerCase
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.core.domain.deletedFilter
import org.poweruptime.backend.core.domain.pageQuery
import org.poweruptime.backend.features.team.model.Team
import org.poweruptime.backend.features.team.model.TeamUser
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

fun Tag.findByTeamIdAndNames(teamId: ULong, names: List<String>): List<TagRecord> =
    selectAll().where { (Tag.teamId eq teamId) and (Tag.name inList names) }.map {
        Tag.rowToTagRecord(it)
    }

fun Tag.findByMonitorId(monitorIds: List<ULong>): List<TagJoinMonitorRecord> =
    innerJoin(MonitorTag, { Tag.id }, { MonitorTag.tagId })
        .selectAll()
        .where { MonitorTag.monitorId inList monitorIds }
        .map {
            TagJoinMonitorRecord(
                tag = Tag.rowToTagRecord(it),
                monitorTag = MonitorTag.rowToMonitorTagRecord(it),
            )
        }

fun Tag.findByMonitorId(monitorId: ULong): List<TagRecord> =
    innerJoin(MonitorTag, { Tag.id }, { MonitorTag.tagId })
        .selectAll()
        .where { MonitorTag.monitorId eq monitorId }
        .map {
            Tag.rowToTagRecord(it)
        }

fun Tag.findAll(
    pageable: Pageable,
    teamId: ULong?,
    userId: ULong?,
    name: String?,
    deleted: Boolean = false,
): Page<TagRecord> {
    require(teamId != null || userId != null) { "teamId or userId needs to be provided" }

    var condition: Op<Boolean> = Tag.deleted.deletedFilter(deleted)

    teamId?.let {
        condition = condition and (Tag.teamId eq it)
    }

    userId?.let {
        condition = condition and (TeamUser.userId eq it)
    }

    name?.let {
        condition = condition and (Tag.name.lowerCase() like "%${it.lowercase()}%")
    }

    val query = innerJoin(Team).innerJoin(TeamUser).selectAll().where(condition)

    return pageQuery(
        query,
        pageable,
        sort = {
            when (it) {
                "name" -> Tag.name
                "variant" -> Tag.variant
                else -> null
            }
        },
        map = { rowToTagRecord(it) },
    )
}
