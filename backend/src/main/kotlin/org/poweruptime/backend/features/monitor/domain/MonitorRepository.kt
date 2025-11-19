package org.poweruptime.backend.features.monitor.domain

import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.count
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.inSubQuery
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.core.isNull
import org.jetbrains.exposed.v1.core.like
import org.jetbrains.exposed.v1.core.lowerCase
import org.jetbrains.exposed.v1.jdbc.andWhere
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.domain.deletedFilter
import org.poweruptime.backend.core.domain.pageQuery
import org.poweruptime.backend.core.exceptions.NotFoundException
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.MonitorRecordJoinTeamRecord
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.MonitorType
import org.poweruptime.backend.features.monitor.model.rowToMonitorRecord
import org.poweruptime.backend.features.notification.model.MonitorNotificationMethod
import org.poweruptime.backend.features.statusPage.model.StatusPage
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupMonitor
import org.poweruptime.backend.features.tag.MonitorTag
import org.poweruptime.backend.features.tag.Tag
import org.poweruptime.backend.features.team.model.Team
import org.poweruptime.backend.features.team.model.TeamUser
import org.poweruptime.backend.features.team.model.rowToTeamRecord
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

fun Monitor.updateStatus(ids: List<ULong>, newStatus: MonitorStatus): Int =
    update({ id inList ids }) {
        it[status] = newStatus
    }

fun Monitor.updateStatus(id: ULong, newStatus: MonitorStatus): Int = update({ Monitor.id eq id }) {
    it[status] = newStatus
}

fun Monitor.findJoinTeamByIdOrThrow(id: ULong): MonitorRecordJoinTeamRecord =
    (Team innerJoin Monitor)
        .selectAll()
        .where { Monitor.id eq id }
        .limit(1)
        .firstOrNull()
        ?.let {
            MonitorRecordJoinTeamRecord(
                monitor = rowToMonitorRecord(it),
                team = Team.rowToTeamRecord(it),
            )
        } ?: throw NotFoundException()

fun Monitor.findByNotificationMethodId(notificationMethodId: ULong): List<MonitorRecord> =
    innerJoin(MonitorNotificationMethod, { Monitor.id }, { MonitorNotificationMethod.monitorId })
        .selectAll()
        .where { MonitorNotificationMethod.notificationMethodId eq notificationMethodId }
        .map {
            rowToMonitorRecord(it)
        }

fun Monitor.findByNotificationMethodId(notificationMethodIds: List<ULong>): Map<ULong, List<MonitorRecord>> =
    innerJoin(MonitorNotificationMethod, { Monitor.id }, { MonitorNotificationMethod.monitorId })
        .selectAll()
        .where { MonitorNotificationMethod.notificationMethodId inList notificationMethodIds }
        .groupBy(
            keySelector = { it[MonitorNotificationMethod.notificationMethodId] },
            valueTransform = { rowToMonitorRecord(it) },
        )

@Suppress("LongMethod")
fun Monitor.findAll(
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

    var selectColumns = columns + Team.columns

    val query = innerJoin(Team)
        .select(selectColumns)

    query.andWhere { Monitor.deleted.deletedFilter(deleted) }

    teamId?.let {
        query.andWhere { Monitor.teamId eq it }
    }
    userId?.let {
        query.adjustColumnSet {
            innerJoin(TeamUser)
        }.adjustSelect {
            selectColumns = selectColumns + TeamUser.userId
            select(selectColumns)
        }.andWhere {
            TeamUser.userId eq it
        }
    }

    if (statusPageSlug != null || usedInStatusPageGroupIds?.takeIf { it.isNotEmpty() } != null) {
        query.adjustColumnSet {
            innerJoin(StatusPageGroupMonitor)
        }
    }

    statusPageSlug?.let {
        query.adjustColumnSet {
            innerJoin(StatusPage)
        }.adjustSelect {
            selectColumns = selectColumns + StatusPage.publicId
            select(selectColumns)
        }.andWhere {
            StatusPage.publicId eq it
        }
    }

    usedInStatusPageGroupIds?.takeIf { it.isNotEmpty() }?.let {
        query.adjustSelect {
            selectColumns = selectColumns + StatusPageGroupMonitor.groupId
            select(selectColumns)
        }.andWhere {
            StatusPageGroupMonitor.groupId inList it
        }
    }

    name?.takeIf { it.isNotEmpty() }?.let {
        query.andWhere {
            Monitor.name.lowerCase() like "%${it.lowercase()}%"
        }
    }

    statuses?.takeIf { it.isNotEmpty() }?.let {
        query.andWhere {
            Monitor.status inList it
        }
    }

    types?.takeIf { it.isNotEmpty() }?.let {
        query.andWhere {
            Monitor.type inList it
        }
    }

    enabledNotificationMethodIds?.takeIf { it.isNotEmpty() }?.let {
        query.adjustColumnSet {
            innerJoin(MonitorNotificationMethod)
        }.adjustSelect {
            selectColumns = selectColumns + MonitorNotificationMethod.notificationMethodId
            select(selectColumns)
        }.andWhere {
            MonitorNotificationMethod.notificationMethodId inList it
        }
    }

    enabledNotificationMethodIds?.takeIf { it.isNotEmpty() }?.let { methodIds ->
        query.andWhere {
            Monitor.id inSubQuery (
                MonitorNotificationMethod
                    .select(MonitorNotificationMethod.monitorId)
                    .where { MonitorNotificationMethod.notificationMethodId inList methodIds }
                )
        }
    }

    tags?.takeIf { it.isNotEmpty() }?.let { tagList ->
        query.andWhere {
            Monitor.id inSubQuery (
                MonitorTag
                    .innerJoin(Tag, { MonitorTag.tagId }, { Tag.id })
                    .select(MonitorTag.monitorId)
                    .where { Tag.name inList tagList }
                )
        }
    }

    return pageQuery(
        query,
        pageable,
        sort = {
            when (it) {
                "name" -> Monitor.name
                "status" -> Monitor.status
                "testIntervalSeconds" -> Monitor.testIntervalSeconds
                "retries" -> Monitor.retries
                "deleted" -> Monitor.deleted
                "createdAt" -> Monitor.createdAt
                "groupMonitors.position" -> StatusPageGroupMonitor.position
                "team.name" -> Team.name
                else -> null
            }
        },
        {
            MonitorRecordJoinTeamRecord(
                monitor = Monitor.rowToMonitorRecord(it),
                team = Team.rowToTeamRecord(it),
            )
        },
    )
}

fun Monitor.findIdsByTeamId(teamId: ULong): List<ULong> = select(Monitor.id).where {
    Monitor.teamId eq teamId and deleted.isNull()
}.map { it[id].value }

fun Monitor.countMonitorsByTeamIdsGrouped(teamIds: List<ULong>): List<TeamStatusCount> =
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

fun Monitor.countMonitorsByUserGrouped(userId: ULong): List<Pair<MonitorStatus, Long>> =
    (Monitor innerJoin Team innerJoin TeamUser)
        .select(status, id.count())
        .where {
            (TeamUser.userId eq userId) and Monitor.deleted.isNull()
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
