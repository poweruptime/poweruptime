package org.poweruptime.backend.features.monitor.service

import org.jetbrains.exposed.v1.core.SqlExpressionBuilder.eq
import org.jetbrains.exposed.v1.jdbc.batchInsert
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.domain.deleteById
import org.poweruptime.backend.core.domain.findByIdOrThrow
import org.poweruptime.backend.core.domain.findByPublicId
import org.poweruptime.backend.core.domain.findByPublicIdOrThrow
import org.poweruptime.backend.core.domain.findIdByPublicIdOrThrow
import org.poweruptime.backend.core.domain.undeleteById
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.features.authentication.domain.ensureAllInTeam
import org.poweruptime.backend.features.monitor.MonitorScheduler
import org.poweruptime.backend.features.monitor.domain.countMonitorsByTeamIdsGrouped
import org.poweruptime.backend.features.monitor.domain.countMonitorsByUserGrouped
import org.poweruptime.backend.features.monitor.domain.findAll
import org.poweruptime.backend.features.monitor.domain.findAllNoneDeleted
import org.poweruptime.backend.features.monitor.domain.findByNotificationMethodId
import org.poweruptime.backend.features.monitor.domain.findJoinTeamByIdOrThrow
import org.poweruptime.backend.features.monitor.domain.updateStatus
import org.poweruptime.backend.features.monitor.dto.CreateMonitorDto
import org.poweruptime.backend.features.monitor.dto.MonitorDashboardResponse
import org.poweruptime.backend.features.monitor.dto.UpdateMonitorDto
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.MonitorRecordJoinTeamRecord
import org.poweruptime.backend.features.monitor.model.MonitorRecordWithDataJoinTeamRecord
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.MonitorTable
import org.poweruptime.backend.features.monitor.model.MonitorType
import org.poweruptime.backend.features.monitor.model.rowToMonitorRecord
import org.poweruptime.backend.features.notification.domain.findByMonitorId
import org.poweruptime.backend.features.notification.model.MonitorNotificationMethodTable
import org.poweruptime.backend.features.notification.model.NotificationMethodTable
import org.poweruptime.backend.features.notification.model.rowToNotificationMethodRecord
import org.poweruptime.backend.features.tag.MonitorTagTable
import org.poweruptime.backend.features.tag.TagService
import org.poweruptime.backend.features.team.model.TeamTable
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Suppress("TooManyFunctions")
@Service
@Transactional(readOnly = true)
class MonitorService(
    private val monitorScheduler: MonitorScheduler,
    private val monitorDataService: MonitorDataService,
    private val tagService: TagService,
) {
    fun getJoinTeamById(id: ULong): MonitorRecordJoinTeamRecord = MonitorTable.findJoinTeamByIdOrThrow(id)

    fun getIdByPublicId(publicId: String, includeDeleted: Boolean = false): ULong =
        MonitorTable.findIdByPublicIdOrThrow(publicId, includeDeleted)

    fun getByPublicId(publicId: String): MonitorRecord =
        MonitorTable.findByPublicIdOrThrow(publicId) {
            MonitorTable.rowToMonitorRecord(it)
        }
    fun getByPublicId(publicIds: List<String>): List<MonitorRecord> =
        MonitorTable.findByPublicId(publicIds) {
            MonitorTable.rowToMonitorRecord(it)
        }

    fun getById(id: ULong): MonitorRecord =
        MonitorTable.findByIdOrThrow(id) {
            MonitorTable.rowToMonitorRecord(it)
        }

    fun getByNotificationMethodId(id: ULong): List<MonitorRecord> = MonitorTable.findByNotificationMethodId(id)
    fun getByNotificationMethodId(ids: List<ULong>): Map<ULong, List<MonitorRecord>> =
        MonitorTable.findByNotificationMethodId(ids)

    fun getAllNoneDeleted(): List<MonitorRecord> = MonitorTable.findAllNoneDeleted()

    fun getAllPaginated(
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
    ): Page<MonitorRecordJoinTeamRecord> = MonitorTable.findAll(
        pageable = pageable,
        teamId = teamId,
        userId = userId,
        statusPageSlug = statusPageSlug,
        name = name,
        enabledNotificationMethodIds = enabledNotificationMethodIds,
        statuses = statuses,
        types = types,
        tags = tags,
        usedInStatusPageGroupIds = usedInStatusPageGroupIds,
        deleted = deleted,
    )

    @Transactional
    fun create(dto: CreateMonitorDto): MonitorRecordWithDataJoinTeamRecord {
        val teamId = TeamTable.findIdByPublicIdOrThrow(dto.teamId)

        val tags = tagService.getByTeamIdAndNames(teamId, dto.tags)

        val notificationMethodIds = NotificationMethodTable.findByPublicId(
            dto.notificationMethodIds,
        ) {
            NotificationMethodTable.rowToNotificationMethodRecord(it)
        }
            .ensureAllInTeam(teamId) { notificationMethod -> notificationMethod.teamId }
            .map { notificationMethod -> notificationMethod.id }

        return MonitorTable.insertAndGetId {
            it[MonitorTable.teamId] = teamId
            it[MonitorTable.type] = dto.data._type
            it[MonitorTable.name] = dto.name
            it[MonitorTable.description] = dto.description
            it[MonitorTable.testIntervalSeconds] = dto.testIntervalSeconds
            it[MonitorTable.retries] = dto.retries
            it[MonitorTable.upsideDown] = dto.upsideDown
            it[MonitorTable.resendAfter] = dto.resendAfter
        }
            .let { getJoinTeamById(it.value) }
            .let {
                MonitorRecordWithDataJoinTeamRecord(
                    monitor = it.monitor,
                    team = it.team,
                    data = monitorDataService.insert(it.monitor, dto.data),
                )
            }.also {
                MonitorTagTable.batchInsert(tags) { tag ->
                    this[MonitorTagTable.tagId] = tag.id
                    this[MonitorTagTable.monitorId] = it.monitor.id
                }

                MonitorNotificationMethodTable.batchInsert(notificationMethodIds) { notificationMethodId ->
                    this[MonitorNotificationMethodTable.notificationMethodId] = notificationMethodId
                    this[MonitorNotificationMethodTable.monitorId] = it.monitor.id
                }

                it.monitor.start()
            }
    }

    @Transactional
    fun update(dto: UpdateMonitorDto): MonitorRecordWithDataJoinTeamRecord =
        MonitorTable.findByPublicIdOrThrow(dto.id) {
            MonitorTable.rowToMonitorRecord(it)
        }.let { monitor ->
            val tags = tagService.getByTeamIdAndNames(monitor.id, dto.tags)

            val notificationMethodIds = NotificationMethodTable.findByPublicId(
                dto.notificationMethodIds,
            ) {
                NotificationMethodTable.rowToNotificationMethodRecord(it)
            }
                .ensureAllInTeam(monitor.teamId) { notificationMethod -> notificationMethod.teamId }
                .map { notificationMethod -> notificationMethod.id }

            MonitorTagTable.deleteWhere { MonitorTagTable.monitorId eq monitor.id }

            MonitorNotificationMethodTable.deleteWhere { MonitorNotificationMethodTable.monitorId eq monitor.id }

            MonitorTagTable.batchInsert(tags) { tag ->
                this[MonitorTagTable.tagId] = tag.id
                this[MonitorTagTable.monitorId] = monitor.id
            }

            MonitorNotificationMethodTable.batchInsert(notificationMethodIds) { notificationMethodId ->
                this[MonitorNotificationMethodTable.notificationMethodId] = notificationMethodId
                this[MonitorNotificationMethodTable.monitorId] = monitor.id
            }

            MonitorTable.update({ MonitorTable.id eq monitor.id }) {
                it[MonitorTable.type] = dto.data._type
                it[MonitorTable.name] = dto.name
                it[MonitorTable.description] = dto.description
                it[MonitorTable.testIntervalSeconds] = dto.testIntervalSeconds
                it[MonitorTable.retries] = dto.retries
                it[MonitorTable.upsideDown] = dto.upsideDown
                it[MonitorTable.resendAfter] = dto.resendAfter
            }.let { MonitorTable.findJoinTeamByIdOrThrow(monitor.id) }
                .let {
                    MonitorRecordWithDataJoinTeamRecord(
                        monitor = it.monitor,
                        team = it.team,
                        data = monitorDataService.update(
                            oldMonitor = monitor,
                            updatedMonitor = it.monitor,
                            data = dto.data,
                        ),
                    )
                }.also {
                    it.monitor.stop().start()
                }
        }

    @Transactional
    fun clone(publicMonitorId: String, teamId: ULong? = null): MonitorRecordJoinTeamRecord =
        MonitorTable.findByPublicIdOrThrow(publicMonitorId) {
            MonitorTable.rowToMonitorRecord(it)
        }.let { monitor ->
            val data = monitorDataService.findByIdAndType(monitor.id, monitor.type)

            MonitorTable.insertAndGetId {
                it[MonitorTable.teamId] = teamId ?: monitor.teamId
                it[MonitorTable.type] = data._type
                it[MonitorTable.name] = "${monitor.name} (Copy)"
                it[MonitorTable.description] = monitor.description
                it[MonitorTable.testIntervalSeconds] = monitor.testIntervalSeconds
                it[MonitorTable.retries] = monitor.retries
                it[MonitorTable.upsideDown] = monitor.upsideDown
                it[MonitorTable.resendAfter] = monitor.resendAfter
            }
                .let { getJoinTeamById(it.value) }
                .let {
                    MonitorRecordWithDataJoinTeamRecord(
                        monitor = it.monitor,
                        team = it.team,
                        data = monitorDataService.insert(it.monitor, data),
                    )
                }
                .also { (updatedMonitor) ->

                    if (teamId == null) {
                        MonitorTagTable.batchInsert(tagService.getByMonitorId(monitor.id)) { tag ->
                            this[MonitorTagTable.tagId] = tag.id
                            this[MonitorTagTable.monitorId] = updatedMonitor.id
                        }

                        MonitorNotificationMethodTable.batchInsert(
                            NotificationMethodTable.findByMonitorId(monitor.id),
                        ) { notificationMethod ->
                            this[MonitorNotificationMethodTable.notificationMethodId] = notificationMethod.id
                            this[MonitorNotificationMethodTable.monitorId] = updatedMonitor.id
                        }
                    }

                    updatedMonitor.start()
                }
        }

    @Transactional
    fun updateStatus(monitorId: ULong, status: MonitorStatus): Int = MonitorTable.updateStatus(monitorId, status)

    @Transactional
    fun deleteById(id: ULong): Int {
        monitorScheduler.stop(id)
        return MonitorTable.deleteById(id)
    }

    @Transactional
    fun deleteById(ids: Iterable<ULong>): Int {
        ids.forEach {
            monitorScheduler.stop(it)
        }
        return MonitorTable.deleteById(ids)
    }

    @Transactional
    fun undeleteById(id: ULong): MonitorRecordJoinTeamRecord = MonitorTable.undeleteById(
        id,
    ).let { getJoinTeamById(id) }.also {
        it.monitor.start()
    }

    @Transactional
    fun pause(id: ULong): MonitorRecordJoinTeamRecord = getJoinTeamById(id).also {
        it.monitor.stop()
        MonitorTable.updateStatus(it.monitor.id, MonitorStatus.PAUSED)
    }.let {
        it.monitor.status = MonitorStatus.PAUSED
        it
    }

    @Transactional
    fun maintenance(id: ULong): MonitorRecordJoinTeamRecord = getJoinTeamById(id).also {
        MonitorTable.updateStatus(it.monitor.id, MonitorStatus.MAINTENANCE)
    }.let {
        it.monitor.status = MonitorStatus.MAINTENANCE
        it
    }

    @Transactional
    fun start(id: ULong): MonitorRecordJoinTeamRecord = getJoinTeamById(id).also {
        if (it.monitor.status !== MonitorStatus.MAINTENANCE && it.monitor.status !== MonitorStatus.PAUSED) {
            throw BadRequestException("Monitor can only start if it's paused or in maintenance")
        }

        MonitorTable.updateStatus(it.monitor.id, MonitorStatus.PENDING)
    }.let {
        it.monitor.status = MonitorStatus.PENDING
        it
    }.also {
        it.monitor.start()
    }

    @Transactional
    fun startAll() {
        val monitors = getAllNoneDeleted()

        monitors
            .filter {
                when (it.status) {
                    MonitorStatus.PENDING,
                    MonitorStatus.DOWN,
                    MonitorStatus.UP -> true
                    MonitorStatus.MAINTENANCE,
                    MonitorStatus.PAUSED -> false
                }
            }.map { it.id }.let { monitorIds ->
                if (monitorIds.isNotEmpty()) {
                    MonitorTable.updateStatus(monitorIds, MonitorStatus.PENDING)
                }
            }

        monitors.forEach { it.start(true) }
    }

    private fun MonitorRecord.start(booting: Boolean = false): MonitorRecord = apply {
        monitorScheduler.start(this, booting)
    }

    private fun MonitorRecord.stop(): MonitorRecord = apply {
        monitorScheduler.stop(this.id)
    }

    fun getUserDashboard(userId: ULong): MonitorDashboardResponse {
        val counts = MonitorTable.countMonitorsByUserGrouped(userId).toMap()

        return MonitorDashboardResponse(
            monitorCount = counts.values.sum(),
            upCount = counts[MonitorStatus.UP] ?: 0,
            downCount = counts[MonitorStatus.DOWN] ?: 0,
            maintenanceCount = counts[MonitorStatus.MAINTENANCE] ?: 0,
            pausedCount = counts[MonitorStatus.PAUSED] ?: 0,
        )
    }

    fun getTeamDashboard(teamId: ULong): MonitorDashboardResponse {
        return getTeamDashboards(listOf(teamId))[teamId] ?: MonitorDashboardResponse()
    }

    fun getTeamDashboards(teamIds: List<ULong>): Map<ULong, MonitorDashboardResponse> {
        val results = MonitorTable.countMonitorsByTeamIdsGrouped(teamIds)

        val grouped = results.groupBy { it.teamId }

        return grouped.mapValues { (_, counts) ->
            val statusMap = counts.associate { it.status to it.count }

            MonitorDashboardResponse(
                monitorCount = statusMap.values.sum(),
                upCount = statusMap[MonitorStatus.UP] ?: 0,
                downCount = statusMap[MonitorStatus.DOWN] ?: 0,
                maintenanceCount = statusMap[MonitorStatus.MAINTENANCE] ?: 0,
                pausedCount = statusMap[MonitorStatus.PAUSED] ?: 0,
            )
        }
    }
}

fun Collection<MonitorRecord>.ensureAllMonitorsInTeam(teamId: ULong) = all { it.teamId == teamId }
