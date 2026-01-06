package org.poweruptime.backend.features.notification.service

import kotlinx.coroutines.runBlocking
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.batchInsert
import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.core.domain.Page
import org.poweruptime.backend.core.domain.findByIdOrThrow
import org.poweruptime.backend.core.domain.findIdByPublicIdOrThrow
import org.poweruptime.backend.core.dto.Pageable
import org.poweruptime.backend.core.utils.orThrowNotFound
import org.poweruptime.backend.features.monitor.model.CheckResultRecord
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.rowToMonitorRecord
import org.poweruptime.backend.features.notification.domain.deleteByTeamIdAndOlderThan
import org.poweruptime.backend.features.notification.domain.findAll
import org.poweruptime.backend.features.notification.model.Notification
import org.poweruptime.backend.features.notification.model.NotificationJoinMonitorAndTeamRecord
import org.poweruptime.backend.features.notification.model.NotificationRecord
import org.poweruptime.backend.features.notification.model.SubNotification
import org.poweruptime.backend.features.notification.model.rowToNotificationRecord
import org.poweruptime.backend.features.team.model.Team
import org.poweruptime.backend.features.team.model.rowToTeamRecord
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
@Transactional(readOnly = true)
class NotificationService(
    private val notificationMethodService: NotificationMethodService,
) {
    fun getById(id: ULong): NotificationRecord = Notification.findByIdOrThrow(id) {
        Notification.rowToNotificationRecord(it)
    }

    fun getIdByPublicId(publicId: String): ULong = Notification.findIdByPublicIdOrThrow(publicId)

    fun getByIdJoinMonitorAndTeam(id: ULong): NotificationJoinMonitorAndTeamRecord =
        Notification
            .innerJoin(Monitor)
            .innerJoin(Team)
            .selectAll()
            .where {
                Notification.id eq id
            }
            .limit(1)
            .firstOrNull()
            ?.let {
                NotificationJoinMonitorAndTeamRecord(
                    notification = Notification.rowToNotificationRecord(it),
                    monitor = Monitor.rowToMonitorRecord(it),
                    team = Team.rowToTeamRecord(it),
                )
            }.orThrowNotFound()

    @Transactional
    fun send(monitorId: ULong, checkResult: CheckResultRecord): NotificationJoinMonitorAndTeamRecord {
        assert(listOf(MonitorStatus.UP, MonitorStatus.DOWN).contains(checkResult.status))

        val notificationId = Notification.insertAndGetId {
            it[Notification.monitorId] = checkResult.monitorId
            it[Notification.checkResultId] = checkResult.id
            it[Notification.publicCheckResultId] = checkResult.publicId
            it[Notification.status] = checkResult.status
            it[Notification.title] = checkResult.title!!
        }.value

        SubNotification.batchInsert(notificationMethodService.getByMonitorId(monitorId)) { notificationMethod ->
            this[SubNotification.notificationId] = notificationId
            this[SubNotification.methodId] = notificationMethod.id
            this[SubNotification.title] = checkResult.title!!
            this[SubNotification.message] = checkResult.message
        }

        return getByIdJoinMonitorAndTeam(notificationId)
    }

    fun getAllPaginated(
        pageable: Pageable,
        monitorId: ULong?,
        teamId: ULong?,
        userId: ULong?,
        statuses: List<MonitorStatus>?,
        start: Instant?,
        end: Instant?,
    ): Page<NotificationJoinMonitorAndTeamRecord> = runBlocking {
        Notification.findAll(
            pageable = pageable,
            monitorId = monitorId,
            teamId = teamId,
            userId = userId,
            statuses = statuses,
            start = start,
            end = end,
        )
    }

    @Transactional
    fun deleteByTeamIdAndOlderThan(teamId: ULong, than: Instant): Int = Notification.deleteByTeamIdAndOlderThan(
        teamId,
        than,
    )
}
