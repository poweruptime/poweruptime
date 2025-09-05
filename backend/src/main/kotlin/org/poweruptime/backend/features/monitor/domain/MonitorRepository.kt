package org.poweruptime.backend.features.monitor.domain

import org.jetbrains.exposed.v1.core.SqlExpressionBuilder.eq
import org.jetbrains.exposed.v1.core.SqlExpressionBuilder.inList
import org.jetbrains.exposed.v1.core.SqlExpressionBuilder.like
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.count
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.core.lowerCase
import org.jetbrains.exposed.v1.jdbc.andWhere
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.domain.deletedFilter
import org.poweruptime.backend.core.domain.pageQuery
import org.poweruptime.backend.core.exceptions.NotFoundException
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.MonitorRecordJoinTeamRecord
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.MonitorTable
import org.poweruptime.backend.features.monitor.model.MonitorType
import org.poweruptime.backend.features.monitor.model.rowToMonitorRecord
import org.poweruptime.backend.features.notification.model.MonitorNotificationMethodTable
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupMonitorTable
import org.poweruptime.backend.features.statusPage.model.StatusPageTable
import org.poweruptime.backend.features.tag.MonitorTagTable
import org.poweruptime.backend.features.tag.TagTable
import org.poweruptime.backend.features.team.model.TeamTable
import org.poweruptime.backend.features.team.model.TeamUserTable
import org.poweruptime.backend.features.team.model.rowToTeamRecord
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

fun MonitorTable.updateStatus(ids: List<ULong>, newStatus: MonitorStatus): Int =
    update({ id inList ids }) {
        it[status] = newStatus
    }

fun MonitorTable.updateStatus(id: ULong, newStatus: MonitorStatus): Int = update({ MonitorTable.id eq id }) {
    it[status] = newStatus
}

fun MonitorTable.findJoinTeamByIdOrThrow(id: ULong): MonitorRecordJoinTeamRecord =
    (TeamTable innerJoin MonitorTable)
        .selectAll()
        .where { MonitorTable.id eq id }
        .limit(1)
        .firstOrNull()
        ?.let {
            MonitorRecordJoinTeamRecord(
                monitor = rowToMonitorRecord(it),
                team = TeamTable.rowToTeamRecord(it),
            )
        } ?: throw NotFoundException()

fun MonitorTable.findByNotificationMethodId(notificationMethodId: ULong): List<MonitorRecord> =
    innerJoin(MonitorNotificationMethodTable, { MonitorTable.id }, { MonitorNotificationMethodTable.monitorId })
        .selectAll()
        .where { MonitorNotificationMethodTable.notificationMethodId eq notificationMethodId }
        .map {
            rowToMonitorRecord(it)
        }

fun MonitorTable.findByNotificationMethodId(notificationMethodIds: List<ULong>): Map<ULong, List<MonitorRecord>> =
    innerJoin(MonitorNotificationMethodTable, { MonitorTable.id }, { MonitorNotificationMethodTable.monitorId })
        .selectAll()
        .where { MonitorNotificationMethodTable.notificationMethodId inList notificationMethodIds }
        .groupBy(
            keySelector = { it[MonitorNotificationMethodTable.notificationMethodId] },
            valueTransform = { rowToMonitorRecord(it) },
        )

@Suppress("LongMethod")
fun MonitorTable.findAll(
    pageable: Pageable,
    teamId: ULong? = null,
    userId: ULong? = null,
    statusPageSlug: String? = null,
    name: String? = null,
    enabledNotificationMethodIds: List<ULong>? = null,
    statuses: List<MonitorStatus>? = null,
    types: List<MonitorType>? = null,
    tags: List<String>? = null,
    usedInStatusPageGroupIds: List<ULong>? = null,
    deleted: Boolean = false
): Page<MonitorRecordJoinTeamRecord> {
    require(teamId != null || userId != null || statusPageSlug != null) {
        "teamId, userId or slug needs to be provided"
    }

    var selectColumns = columns + TeamTable.columns

    val query = innerJoin(TeamTable)
        .select(selectColumns)

    query.andWhere { MonitorTable.deleted.deletedFilter(deleted) }

    teamId?.let {
        query.andWhere { MonitorTable.teamId eq it }
    }
    userId?.let {
        query.adjustColumnSet {
            innerJoin(TeamUserTable)
        }.adjustSelect {
            selectColumns = selectColumns + TeamUserTable.userId
            select(selectColumns)
        }.andWhere {
            TeamUserTable.userId eq it
        }
    }

    if (statusPageSlug != null || usedInStatusPageGroupIds?.takeIf { it.isNotEmpty() } != null) {
        query.adjustColumnSet {
            innerJoin(StatusPageGroupMonitorTable)
        }
    }

    statusPageSlug?.let {
        query.adjustColumnSet {
            innerJoin(StatusPageTable)
        }.adjustSelect {
            selectColumns = selectColumns + StatusPageTable.publicId
            select(selectColumns)
        }.andWhere {
            StatusPageTable.publicId eq it
        }
    }

    usedInStatusPageGroupIds?.takeIf { it.isNotEmpty() }?.let {
        query.adjustSelect {
            selectColumns = selectColumns + StatusPageGroupMonitorTable.groupId
            select(selectColumns)
        }.andWhere {
            StatusPageGroupMonitorTable.groupId inList it
        }
    }

    name?.takeIf { it.isNotEmpty() }?.let {
        query.andWhere {
            MonitorTable.name.lowerCase() like "%${it.lowercase()}%"
        }
    }

    statuses?.takeIf { it.isNotEmpty() }?.let {
        query.andWhere {
            MonitorTable.status inList it
        }
    }

    types?.takeIf { it.isNotEmpty() }?.let {
        query.andWhere {
            MonitorTable.type inList it
        }
    }

    enabledNotificationMethodIds?.takeIf { it.isNotEmpty() }?.let {
        query.adjustColumnSet {
            innerJoin(MonitorNotificationMethodTable)
        }.adjustSelect {
            selectColumns = selectColumns + MonitorNotificationMethodTable.notificationMethodId
            select(selectColumns)
        }.andWhere {
            MonitorNotificationMethodTable.notificationMethodId inList it
        }
    }

    enabledNotificationMethodIds?.takeIf { it.isNotEmpty() }?.let { methodIds ->
        query.andWhere {
            MonitorTable.id inSubQuery (
                MonitorNotificationMethodTable
                    .select(MonitorNotificationMethodTable.monitorId)
                    .where { MonitorNotificationMethodTable.notificationMethodId inList methodIds }
                )
        }
    }

    tags?.takeIf { it.isNotEmpty() }?.let { tagList ->
        query.andWhere {
            MonitorTable.id inSubQuery (
                MonitorTagTable
                    .innerJoin(TagTable, { MonitorTagTable.tagId }, { TagTable.id })
                    .select(MonitorTagTable.monitorId)
                    .where { TagTable.name inList tagList }
                )
        }
    }

    return pageQuery(
        query,
        pageable,
        sort = {
            when (it) {
                "name" -> MonitorTable.name
                "status" -> MonitorTable.status
                "testIntervalSeconds" -> MonitorTable.testIntervalSeconds
                "retries" -> MonitorTable.retries
                "deleted" -> MonitorTable.deleted
                "createdAt" -> MonitorTable.createdAt
                "groupMonitors.position" -> StatusPageGroupMonitorTable.position
                "team.name" -> TeamTable.name
                else -> null
            }
        },
        {
            MonitorRecordJoinTeamRecord(
                monitor = MonitorTable.rowToMonitorRecord(it),
                team = TeamTable.rowToTeamRecord(it),
            )
        },
    )
}

fun MonitorTable.findAllNoneDeleted(): List<MonitorRecord> =
    selectAll().where { deleted.isNull() }.map { rowToMonitorRecord(it) }

fun MonitorTable.findIdsByTeamId(teamId: ULong): List<ULong> = select(MonitorTable.id).where {
    MonitorTable.teamId eq teamId and deleted.isNull()
}.map { it[id].value }

fun MonitorTable.countMonitorsByTeamIdsGrouped(teamIds: List<ULong>): List<TeamStatusCount> =
    select(
        teamId,
        status,
        id.count(), // same as COUNT(*)
    )
        .where {
            (teamId inList teamIds) and (deleted.isNull())
        }
        .groupBy(teamId, status)
        .map {
            TeamStatusCount(
                teamId = it[teamId],
                status = it[status],
                count = it[id.count()],
            )
        }

fun MonitorTable.countMonitorsByUserGrouped(userId: ULong): List<Pair<MonitorStatus, Long>> =
    (MonitorTable innerJoin TeamTable innerJoin TeamUserTable)
        .select(status, id.count())
        .where {
            (TeamUserTable.userId eq userId) and MonitorTable.deleted.isNull()
        }
        .groupBy(status)
        .map {
            it[status] to it[id.count()]
        }

data class TeamStatusCount(
    val teamId: ULong,
    val status: MonitorStatus,
    val count: Long
)
