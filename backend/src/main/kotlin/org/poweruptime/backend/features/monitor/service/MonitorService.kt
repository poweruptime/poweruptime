package org.poweruptime.backend.features.monitor.service

import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.batchInsert
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.domain.Page
import org.poweruptime.backend.core.domain.deleteById
import org.poweruptime.backend.core.domain.findAll
import org.poweruptime.backend.core.domain.findByIdOrThrow
import org.poweruptime.backend.core.domain.findByPublicId
import org.poweruptime.backend.core.domain.findByPublicIdOrThrow
import org.poweruptime.backend.core.domain.findIdByPublicIdOrThrow
import org.poweruptime.backend.core.domain.undeleteById
import org.poweruptime.backend.core.dto.Pageable
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.features.authentication.permission.ensureAllInTeam
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
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.MonitorRecordJoinTeamRecord
import org.poweruptime.backend.features.monitor.model.MonitorRecordWithDataJoinTeamRecord
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.MonitorType
import org.poweruptime.backend.features.monitor.model.rowToMonitorRecord
import org.poweruptime.backend.features.notification.domain.findByMonitorId
import org.poweruptime.backend.features.notification.model.MonitorNotificationMethod
import org.poweruptime.backend.features.notification.model.NotificationMethod
import org.poweruptime.backend.features.notification.model.rowToNotificationMethodRecord
import org.poweruptime.backend.features.tag.MonitorTag
import org.poweruptime.backend.features.tag.TagService
import org.poweruptime.backend.features.team.model.Team
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
    fun getJoinTeamById(id: ULong): MonitorRecordJoinTeamRecord = Monitor.findJoinTeamByIdOrThrow(id)

    fun getIdByPublicId(publicId: String, includeDeleted: Boolean = false): ULong =
        Monitor.findIdByPublicIdOrThrow(publicId, includeDeleted)

    fun getByPublicId(publicId: String): MonitorRecord = Monitor.findByPublicIdOrThrow(publicId) {
        Monitor.rowToMonitorRecord(it)
    }

    fun getByPublicId(publicIds: List<String>): List<MonitorRecord> = Monitor.findByPublicId(publicIds) {
        Monitor.rowToMonitorRecord(it)
    }

    fun getById(id: ULong): MonitorRecord = Monitor.findByIdOrThrow(id) {
        Monitor.rowToMonitorRecord(it)
    }

    fun getByNotificationMethodId(id: ULong): List<MonitorRecord> = Monitor.findByNotificationMethodId(id)

    fun getByNotificationMethodId(ids: List<ULong>): Map<ULong, List<MonitorRecord>> =
        Monitor.findByNotificationMethodId(ids)

    fun getAllNoneDeleted(): List<MonitorRecord> = Monitor.findAllNoneDeleted()

    fun getAllPaginated(
        pageable: Pageable,
        teamId: ULong? = null,
        userId: ULong? = null,
        name: String? = null,
        enabledNotificationMethodIds: List<ULong>? = null,
        statuses: List<MonitorStatus>? = null,
        types: List<MonitorType>? = null,
        tags: List<String>? = null,
        deleted: Boolean = false,
    ): Page<MonitorRecordJoinTeamRecord> = Monitor.findAll(
        pageable = pageable,
        teamId = teamId,
        userId = userId,
        name = name,
        enabledNotificationMethodIds = enabledNotificationMethodIds,
        statuses = statuses,
        types = types,
        tags = tags,
        deleted = deleted,
    )

    @Transactional
    fun create(dto: CreateMonitorDto): MonitorRecordWithDataJoinTeamRecord {
        val teamId = Team.findIdByPublicIdOrThrow(dto.teamId)

        val tags = tagService.getByTeamIdAndNames(teamId, dto.tags)

        val notificationMethodIds = NotificationMethod
            .findByPublicId(
                dto.notificationMethodIds,
            ) {
                NotificationMethod.rowToNotificationMethodRecord(it)
            }.ensureAllInTeam(teamId) { notificationMethod -> notificationMethod.teamId }
            .map { notificationMethod -> notificationMethod.id }

        return Monitor
            .insertAndGetId {
                it[Monitor.teamId] = teamId
                it[Monitor.type] = dto.data._type
                it[Monitor.name] = dto.name
                it[Monitor.description] = dto.description
                it[Monitor.testIntervalSeconds] = dto.testIntervalSeconds
                it[Monitor.retries] = dto.retries
                it[Monitor.upsideDown] = dto.upsideDown
                it[Monitor.resendAfter] = dto.resendAfter
            }.let { getJoinTeamById(it.value) }
            .let {
                MonitorRecordWithDataJoinTeamRecord(
                    monitor = it.monitor,
                    team = it.team,
                    data = monitorDataService.insert(it.monitor, dto.data),
                )
            }.also {
                MonitorTag.batchInsert(tags) { tag ->
                    this[MonitorTag.tagId] = tag.id
                    this[MonitorTag.monitorId] = it.monitor.id
                }

                MonitorNotificationMethod.batchInsert(notificationMethodIds) { notificationMethodId ->
                    this[MonitorNotificationMethod.notificationMethodId] = notificationMethodId
                    this[MonitorNotificationMethod.monitorId] = it.monitor.id
                }

                it.monitor.start()
            }
    }

    @Transactional
    fun update(dto: UpdateMonitorDto): MonitorRecordWithDataJoinTeamRecord = Monitor
        .findByPublicIdOrThrow(dto.id) {
            Monitor.rowToMonitorRecord(it)
        }.let { monitor ->
            val tags = tagService.getByTeamIdAndNames(monitor.teamId, dto.tags)

            val notificationMethodIds = NotificationMethod
                .findByPublicId(
                    dto.notificationMethodIds,
                ) {
                    NotificationMethod.rowToNotificationMethodRecord(it)
                }.ensureAllInTeam(monitor.teamId) { notificationMethod -> notificationMethod.teamId }
                .map { notificationMethod -> notificationMethod.id }

            MonitorTag.deleteWhere { MonitorTag.monitorId eq monitor.id }

            MonitorNotificationMethod.deleteWhere { MonitorNotificationMethod.monitorId eq monitor.id }

            MonitorTag.batchInsert(tags) { tag ->
                this[MonitorTag.tagId] = tag.id
                this[MonitorTag.monitorId] = monitor.id
            }

            MonitorNotificationMethod.batchInsert(notificationMethodIds) { notificationMethodId ->
                this[MonitorNotificationMethod.notificationMethodId] = notificationMethodId
                this[MonitorNotificationMethod.monitorId] = monitor.id
            }

            Monitor
                .update({ Monitor.id eq monitor.id }) {
                    it[Monitor.type] = dto.data._type
                    it[Monitor.name] = dto.name
                    it[Monitor.description] = dto.description
                    it[Monitor.testIntervalSeconds] = dto.testIntervalSeconds
                    it[Monitor.retries] = dto.retries
                    it[Monitor.upsideDown] = dto.upsideDown
                    it[Monitor.resendAfter] = dto.resendAfter
                }.let { Monitor.findJoinTeamByIdOrThrow(monitor.id) }
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
    fun clone(publicMonitorId: String, teamId: ULong? = null): MonitorRecordJoinTeamRecord = Monitor
        .findByPublicIdOrThrow(publicMonitorId) {
            Monitor.rowToMonitorRecord(it)
        }.let { monitor ->
            val data = monitorDataService.findByIdAndType(monitor.id, monitor.type)

            Monitor
                .insertAndGetId {
                    it[Monitor.teamId] = teamId ?: monitor.teamId
                    it[Monitor.type] = data._type
                    it[Monitor.name] = "${monitor.name} (Copy)"
                    it[Monitor.description] = monitor.description
                    it[Monitor.testIntervalSeconds] = monitor.testIntervalSeconds
                    it[Monitor.retries] = monitor.retries
                    it[Monitor.upsideDown] = monitor.upsideDown
                    it[Monitor.resendAfter] = monitor.resendAfter
                }.let { getJoinTeamById(it.value) }
                .let {
                    MonitorRecordWithDataJoinTeamRecord(
                        monitor = it.monitor,
                        team = it.team,
                        data = monitorDataService.insert(it.monitor, data),
                    )
                }.also { (updatedMonitor) ->

                    if (teamId == null) {
                        MonitorTag.batchInsert(tagService.getByMonitorId(monitor.id)) { tag ->
                            this[MonitorTag.tagId] = tag.id
                            this[MonitorTag.monitorId] = updatedMonitor.id
                        }

                        MonitorNotificationMethod.batchInsert(
                            NotificationMethod.findByMonitorId(monitor.id),
                        ) { notificationMethod ->
                            this[MonitorNotificationMethod.notificationMethodId] = notificationMethod.id
                            this[MonitorNotificationMethod.monitorId] = updatedMonitor.id
                        }
                    }

                    updatedMonitor.start()
                }
        }

    @Transactional
    fun updateStatus(monitorId: ULong, status: MonitorStatus): Int = Monitor.updateStatus(monitorId, status)

    @Transactional
    fun deleteById(id: ULong): Int {
        monitorScheduler.stop(id)
        return Monitor.deleteById(id)
    }

    @Transactional
    fun deleteById(ids: Iterable<ULong>): Int {
        ids.forEach {
            monitorScheduler.stop(it)
        }
        return Monitor.deleteById(ids)
    }

    @Transactional
    fun undeleteById(id: ULong): MonitorRecordJoinTeamRecord = Monitor
        .undeleteById(
            id,
        ).let { getJoinTeamById(id) }
        .also {
            it.monitor.start()
        }

    @Transactional
    fun pause(id: ULong): MonitorRecordJoinTeamRecord = getJoinTeamById(id)
        .also {
            it.monitor.stop()
            Monitor.updateStatus(it.monitor.id, MonitorStatus.PAUSED)
        }.let {
            it.monitor.status = MonitorStatus.PAUSED
            it
        }

    @Transactional
    fun maintenance(id: ULong): MonitorRecordJoinTeamRecord = getJoinTeamById(id)
        .also {
            Monitor.updateStatus(it.monitor.id, MonitorStatus.MAINTENANCE)
        }.let {
            it.monitor.status = MonitorStatus.MAINTENANCE
            it
        }

    @Transactional
    fun start(id: ULong): MonitorRecordJoinTeamRecord = getJoinTeamById(id)
        .also {
            if (it.monitor.status !== MonitorStatus.MAINTENANCE && it.monitor.status !== MonitorStatus.PAUSED) {
                throw BadRequestException("Monitor can only start if it's paused or in maintenance")
            }

            Monitor.updateStatus(it.monitor.id, MonitorStatus.PENDING)
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
                    MonitorStatus.UP,
                    -> true

                    MonitorStatus.MAINTENANCE,
                    MonitorStatus.PAUSED,
                    -> false
                }
            }.map { it.id }
            .let { monitorIds ->
                if (monitorIds.isNotEmpty()) {
                    Monitor.updateStatus(monitorIds, MonitorStatus.PENDING)
                }
            }

        monitors.forEach { it.start(true) }
    }

    fun stop(monitor: MonitorRecord) {
        monitor.stop()
    }

    private fun MonitorRecord.start(booting: Boolean = false): MonitorRecord = apply {
        monitorScheduler.start(this, booting)
    }

    private fun MonitorRecord.stop(): MonitorRecord = apply {
        monitorScheduler.stop(this.id)
    }

    fun getUserDashboard(userId: ULong): MonitorDashboardResponse {
        val counts = Monitor.countMonitorsByUserGrouped(userId).toMap()

        return MonitorDashboardResponse(
            monitorCount = counts.values.sum(),
            upCount = counts[MonitorStatus.UP] ?: 0,
            downCount = counts[MonitorStatus.DOWN] ?: 0,
            maintenanceCount = counts[MonitorStatus.MAINTENANCE] ?: 0,
            pausedCount = counts[MonitorStatus.PAUSED] ?: 0,
        )
    }

    fun getTeamDashboard(teamId: ULong): MonitorDashboardResponse =
        getTeamDashboards(listOf(teamId))[teamId] ?: MonitorDashboardResponse()

    fun getTeamDashboards(teamIds: List<ULong>): Map<ULong, MonitorDashboardResponse> {
        val results = Monitor.countMonitorsByTeamIdsGrouped(teamIds)

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
