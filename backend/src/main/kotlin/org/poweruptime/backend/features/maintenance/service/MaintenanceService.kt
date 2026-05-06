package org.poweruptime.backend.features.maintenance.service

import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greater
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.isNotNull
import org.jetbrains.exposed.v1.core.isNull
import org.jetbrains.exposed.v1.core.lessEq
import org.jetbrains.exposed.v1.jdbc.andWhere
import org.jetbrains.exposed.v1.jdbc.batchInsert
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.domain.Page
import org.poweruptime.backend.core.domain.findByPublicIdOrThrow
import org.poweruptime.backend.core.domain.findIdByPublicIdOrThrow
import org.poweruptime.backend.core.dto.Pageable
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.core.utils.orThrowNotFound
import org.poweruptime.backend.features.maintenance.dto.CreateMaintenanceDto
import org.poweruptime.backend.features.maintenance.dto.UpdateMaintenanceDto
import org.poweruptime.backend.features.maintenance.model.Maintenance
import org.poweruptime.backend.features.maintenance.model.MaintenanceAlertBehavior
import org.poweruptime.backend.features.maintenance.model.MaintenanceMonitor
import org.poweruptime.backend.features.maintenance.model.MaintenanceRecord
import org.poweruptime.backend.features.maintenance.model.MaintenanceVisibility
import org.poweruptime.backend.features.maintenance.model.rowToMaintenanceJoinMonitorRecord
import org.poweruptime.backend.features.maintenance.model.rowToMaintenanceRecord
import org.poweruptime.backend.features.monitor.model.CheckResult
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.rowToCheckResultRecord
import org.poweruptime.backend.features.monitor.model.rowToMonitorRecord
import org.poweruptime.backend.features.monitor.service.MonitorService
import org.poweruptime.backend.features.monitor.service.ensureAllMonitorsInTeam
import org.poweruptime.backend.features.notification.service.NotificationService
import org.poweruptime.backend.features.notification.service.SubNotificationService
import org.poweruptime.backend.features.team.model.Team
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
@Transactional(readOnly = true)
class MaintenanceService(
    private val monitorService: MonitorService,
    private val notificationService: NotificationService,
    private val subNotificationService: SubNotificationService,
) {
    fun getIdByPublicId(publicId: String): ULong = Maintenance.findIdByPublicIdOrThrow(publicId)

    fun getByPublicId(publicId: String): MaintenanceRecord = Maintenance.findByPublicIdOrThrow(publicId) {
        Maintenance.rowToMaintenanceRecord(it)
    }

    fun getMonitors(maintenanceId: ULong): List<MonitorRecord> = MaintenanceMonitor
        .innerJoin(Monitor)
        .selectAll()
        .where { MaintenanceMonitor.maintenanceId eq maintenanceId }
        .map { Monitor.rowToMonitorRecord(it) }

    fun getAllPaginated(pageable: Pageable, teamId: ULong, state: MaintenanceState?): Page<MaintenanceRecord> {
        val now = Instant.now()
        val base = Maintenance
            .selectAll()
            .where { (Maintenance.teamId eq teamId) and Maintenance.deleted.isNull() }

        when (state) {
            MaintenanceState.UPCOMING -> base.andWhere { Maintenance.startsAt greater now }

            MaintenanceState.ACTIVE -> base.andWhere {
                (Maintenance.startsAt lessEq now) and (Maintenance.endsAt greater now)
            }

            MaintenanceState.COMPLETED -> base.andWhere { Maintenance.endsAt lessEq now }

            null -> Unit
        }

        val total = base.count()
        val content = base
            .orderBy(Maintenance.startsAt, SortOrder.DESC)
            .limit(pageable.pageSize)
            .offset(pageable.offset)
            .map { Maintenance.rowToMaintenanceRecord(it) }

        return Page(content, pageable, total)
    }

    fun findActiveByMonitorId(monitorId: ULong, now: Instant = Instant.now()): MaintenanceRecord? = Maintenance
        .innerJoin(MaintenanceMonitor)
        .selectAll()
        .where {
            (MaintenanceMonitor.monitorId eq monitorId) and
                Maintenance.deleted.isNull() and
                (Maintenance.startedAt.isNotNull()) and
                Maintenance.endedAt.isNull() and
                (Maintenance.startsAt lessEq now) and
                (Maintenance.endsAt greater now)
        }
        .orderBy(Maintenance.startsAt, SortOrder.ASC)
        .limit(1)
        .firstOrNull()
        ?.let { Maintenance.rowToMaintenanceRecord(it) }

    fun findPublicByStatusPageMonitorIds(monitorIds: List<ULong>, now: Instant = Instant.now()): PublicMaintenances {
        if (monitorIds.isEmpty()) {
            return PublicMaintenances()
        }

        val rows = Maintenance
            .innerJoin(MaintenanceMonitor)
            .innerJoin(Monitor)
            .selectAll()
            .where {
                (MaintenanceMonitor.monitorId inList monitorIds) and
                    (Maintenance.visibility eq MaintenanceVisibility.PUBLIC) and
                    Maintenance.deleted.isNull()
            }
            .orderBy(Maintenance.startsAt, SortOrder.DESC)
            .map { rowToMaintenanceJoinMonitorRecord(it) }

        val grouped = rows.groupBy { it.maintenance.publicId }
        val maintenances = grouped.values.map { joins ->
            joins.first().maintenance to joins.map { it.monitor }.distinctBy { it.id }
        }

        return PublicMaintenances(
            upcoming = maintenances
                .filter { (maintenance) -> maintenance.startsAt > now }
                .sortedBy { (maintenance) -> maintenance.startsAt },
            active = maintenances
                .filter { (maintenance) -> maintenance.startsAt <= now && maintenance.endsAt > now }
                .sortedBy { (maintenance) -> maintenance.startsAt },
            completed = maintenances
                .filter { (maintenance) -> maintenance.endsAt <= now }
                .sortedByDescending { (maintenance) -> maintenance.endsAt }
                .take(10),
        )
    }

    @Transactional
    fun create(dto: CreateMaintenanceDto): MaintenanceRecord {
        val startsAt = if (dto.startNow) {
            Instant.now()
        } else {
            dto.startsAt
                ?: throw BadRequestException("startsAt is required for scheduled maintenance")
        }
        val teamId = Team.findIdByPublicIdOrThrow(dto.teamId)
        validateTimes(startsAt, dto.endsAt)
        val monitors = validateMonitors(teamId, dto.monitorIds)

        val maintenance = Maintenance.insertAndGetId {
            it[Maintenance.teamId] = teamId
            it[Maintenance.name] = dto.title
            it[Maintenance.description] = dto.description
            it[Maintenance.startsAt] = startsAt
            it[Maintenance.endsAt] = dto.endsAt
            it[Maintenance.timeZone] = dto.timeZone
            it[Maintenance.visibility] = dto.visibility
            it[Maintenance.alertBehavior] = dto.alertBehavior
            it[Maintenance.notifyScheduled] = dto.notifyScheduled
            it[Maintenance.notifyStarted] = dto.notifyStarted
            it[Maintenance.notifyEnded] = dto.notifyEnded
            it[Maintenance.reminderOffsetsMinutes] = normalizeReminderOffsets(dto.reminderOffsetsMinutes)
            it[Maintenance.reminderSentOffsetsMinutes] = emptyList()
        }.let { getById(it.value) }

        replaceMonitors(maintenance.id, monitors)

        if (dto.notifyScheduled) {
            sendMaintenanceNotifications(maintenance, monitors, "Maintenance scheduled")
            markScheduledNotified(maintenance.id)
        }

        if (!startsAt.isAfter(Instant.now())) {
            processDueMaintenances()
        }

        return getById(maintenance.id)
    }

    @Transactional
    fun update(dto: UpdateMaintenanceDto): MaintenanceRecord {
        val old = getByPublicId(dto.id)
        if (old.startedAt != null) {
            throw BadRequestException("Started maintenance cannot be edited")
        }
        validateTimes(dto.startsAt, dto.endsAt)
        val monitors = validateMonitors(old.teamId, dto.monitorIds)

        Maintenance.update({ Maintenance.id eq old.id }) {
            it[name] = dto.title
            it[description] = dto.description
            it[startsAt] = dto.startsAt
            it[endsAt] = dto.endsAt
            it[timeZone] = dto.timeZone
            it[visibility] = dto.visibility
            it[alertBehavior] = dto.alertBehavior
            it[notifyScheduled] = dto.notifyScheduled
            it[notifyStarted] = dto.notifyStarted
            it[notifyEnded] = dto.notifyEnded
            it[reminderOffsetsMinutes] = normalizeReminderOffsets(dto.reminderOffsetsMinutes)
            it[reminderSentOffsetsMinutes] = emptyList()
        }
        replaceMonitors(old.id, monitors)
        return getById(old.id)
    }

    @Transactional
    fun delete(publicId: String) {
        val maintenance = getByPublicId(publicId)
        Maintenance.update({ Maintenance.id eq maintenance.id }) {
            it[deleted] = Instant.now()
        }
    }

    @Transactional
    fun processDueMaintenances(now: Instant = Instant.now()) {
        sendDueReminders(now)
        startDueMaintenances(now)
        endDueMaintenances(now)
    }

    private fun startDueMaintenances(now: Instant) {
        val due = Maintenance
            .selectAll()
            .where {
                Maintenance.deleted.isNull() and
                    Maintenance.startedAt.isNull() and
                    (Maintenance.startsAt lessEq now)
            }
            .map { Maintenance.rowToMaintenanceRecord(it) }

        due.forEach { maintenance ->
            val monitors = getMonitors(maintenance.id)
            Monitor.update({ Monitor.id inList monitors.map { it.id } }) {
                it[status] = MonitorStatus.MAINTENANCE
            }
            Maintenance.update({ Maintenance.id eq maintenance.id }) {
                it[startedAt] = now
            }
            if (maintenance.notifyStarted || maintenance.alertBehavior == MaintenanceAlertBehavior.DOWNGRADE) {
                sendMaintenanceNotifications(maintenance, monitors, "Maintenance started")
                Maintenance.update({ Maintenance.id eq maintenance.id }) {
                    it[startedNotifiedAt] = now
                }
            }
        }
    }

    private fun endDueMaintenances(now: Instant) {
        val due = Maintenance
            .selectAll()
            .where {
                Maintenance.deleted.isNull() and
                    Maintenance.startedAt.isNotNull() and
                    Maintenance.endedAt.isNull() and
                    (Maintenance.endsAt lessEq now)
            }
            .map { Maintenance.rowToMaintenanceRecord(it) }

        due.forEach { maintenance ->
            val monitors = getMonitors(maintenance.id)
            Monitor.update({
                (Monitor.id inList monitors.map { it.id }) and (Monitor.status eq MonitorStatus.MAINTENANCE)
            }) {
                it[status] = MonitorStatus.PENDING
            }
            Maintenance.update({ Maintenance.id eq maintenance.id }) {
                it[endedAt] = now
            }
            if (maintenance.notifyEnded) {
                sendMaintenanceNotifications(maintenance, monitors, "Maintenance ended")
                Maintenance.update({ Maintenance.id eq maintenance.id }) {
                    it[endedNotifiedAt] = now
                }
            }
        }
    }

    private fun sendDueReminders(now: Instant) {
        val upcoming = Maintenance
            .selectAll()
            .where {
                Maintenance.deleted.isNull() and
                    Maintenance.startedAt.isNull() and
                    (Maintenance.startsAt greater now)
            }
            .map { Maintenance.rowToMaintenanceRecord(it) }

        upcoming.forEach { maintenance ->
            val dueOffsets = maintenance.reminderOffsetsMinutes
                .filterNot { maintenance.reminderSentOffsetsMinutes.contains(it) }
                .filter { maintenance.startsAt.minusSeconds(it.toLong() * 60) <= now }

            if (dueOffsets.isEmpty()) {
                return@forEach
            }

            sendMaintenanceNotifications(
                maintenance,
                getMonitors(maintenance.id),
                "Maintenance starts in ${dueOffsets.min()} minutes",
            )
            Maintenance.update({ Maintenance.id eq maintenance.id }) {
                it[reminderSentOffsetsMinutes] = (maintenance.reminderSentOffsetsMinutes + dueOffsets).distinct()
            }
        }
    }

    private fun sendMaintenanceNotifications(
        maintenance: MaintenanceRecord,
        monitors: List<MonitorRecord>,
        title: String,
    ) {
        monitors.forEach { monitor ->
            val checkResultId = CheckResult.insertAndGetId {
                it[monitorId] = monitor.id
                it[status] = MonitorStatus.MAINTENANCE
                it[previousStatus] = monitor.status
                it[pickedUpAt] = Instant.now()
                it[checkedAt] = Instant.now()
                it[CheckResult.maintenanceId] = maintenance.id
                it[CheckResult.title] = title
                it[message] = maintenance.description ?: maintenance.title
            }.value
            val checkResult = CheckResult.rowToCheckResultRecord(
                CheckResult.selectAll().where { CheckResult.id eq checkResultId }.first(),
            )
            val notificationJoin = notificationService.send(monitor.id, checkResult, maintenance.id)
            subNotificationService.getByNotificationId(notificationJoin.notification.id).forEach {
                subNotificationService.queueNotification(it.subNotification.id)
            }
        }
    }

    private fun validateTimes(startsAt: Instant, endsAt: Instant) {
        if (!endsAt.isAfter(startsAt)) {
            throw BadRequestException("endsAt must be after startsAt")
        }
    }

    private fun validateMonitors(teamId: ULong, publicMonitorIds: List<String>): List<MonitorRecord> {
        if (publicMonitorIds.isEmpty()) {
            throw BadRequestException("At least one monitor is required")
        }
        val monitors = monitorService.getByPublicId(publicMonitorIds)
        if (monitors.size != publicMonitorIds.toSet().size) {
            throw BadRequestException("Monitor not found")
        }
        if (!monitors.ensureAllMonitorsInTeam(teamId)) {
            throw BadRequestException("All monitors should be in the same team as the maintenance")
        }
        return monitors
    }

    private fun replaceMonitors(maintenanceId: ULong, monitors: List<MonitorRecord>) {
        MaintenanceMonitor.deleteWhere { MaintenanceMonitor.maintenanceId eq maintenanceId }
        MaintenanceMonitor.batchInsert(monitors) { monitor ->
            this[MaintenanceMonitor.maintenanceId] = maintenanceId
            this[MaintenanceMonitor.monitorId] = monitor.id
        }
    }

    private fun getById(id: ULong): MaintenanceRecord = Maintenance
        .selectAll()
        .where { Maintenance.id eq id }
        .limit(1)
        .firstOrNull()
        ?.let { Maintenance.rowToMaintenanceRecord(it) }
        .orThrowNotFound()

    private fun markScheduledNotified(id: ULong) {
        Maintenance.update({ Maintenance.id eq id }) {
            it[scheduledNotifiedAt] = Instant.now()
        }
    }

    private fun normalizeReminderOffsets(offsets: List<Int>): List<Int> = offsets
        .filter { it > 0 }
        .distinct()
        .sortedDescending()
}

enum class MaintenanceState {
    UPCOMING,
    ACTIVE,
    COMPLETED,
}

data class PublicMaintenances(
    val upcoming: List<Pair<MaintenanceRecord, List<MonitorRecord>>> = emptyList(),
    val active: List<Pair<MaintenanceRecord, List<MonitorRecord>>> = emptyList(),
    val completed: List<Pair<MaintenanceRecord, List<MonitorRecord>>> = emptyList(),
)
