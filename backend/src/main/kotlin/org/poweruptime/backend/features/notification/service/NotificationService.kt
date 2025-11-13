package org.poweruptime.backend.features.notification.service

import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.batchInsert
import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.core.domain.findByIdOrThrow
import org.poweruptime.backend.core.domain.findIdByPublicIdOrThrow
import org.poweruptime.backend.core.utils.orThrowNotFound
import org.poweruptime.backend.features.monitor.model.CheckResultRecord
import org.poweruptime.backend.features.monitor.model.CheckResultTable
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.MonitorTable
import org.poweruptime.backend.features.monitor.model.rowToCheckResultRecord
import org.poweruptime.backend.features.monitor.model.rowToMonitorRecord
import org.poweruptime.backend.features.notification.domain.deleteByTeamIdAndOlderThan
import org.poweruptime.backend.features.notification.domain.findAll
import org.poweruptime.backend.features.notification.model.NotificationJoinCheckResultMonitorAndTeamRecord
import org.poweruptime.backend.features.notification.model.NotificationRecord
import org.poweruptime.backend.features.notification.model.NotificationTable
import org.poweruptime.backend.features.notification.model.SubNotificationTable
import org.poweruptime.backend.features.notification.model.rowToNotificationRecord
import org.poweruptime.backend.features.team.model.TeamTable
import org.poweruptime.backend.features.team.model.rowToTeamRecord
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
@Transactional(readOnly = true)
class NotificationService(
    private val notificationMethodService: NotificationMethodService,
) {
    fun getById(id: ULong): NotificationRecord = NotificationTable.findByIdOrThrow(id) {
        NotificationTable.rowToNotificationRecord(it)
    }

    fun getIdByPublicId(publicId: String): ULong = NotificationTable.findIdByPublicIdOrThrow(publicId)

    fun getByIdJoinCheckResultMonitorAndTeam(id: ULong): NotificationJoinCheckResultMonitorAndTeamRecord =
        NotificationTable
            .innerJoin(CheckResultTable)
            .innerJoin(MonitorTable)
            .innerJoin(TeamTable)
            .selectAll()
            .where {
                NotificationTable.id eq id
            }
            .limit(1)
            .firstOrNull()
            ?.let {
                NotificationJoinCheckResultMonitorAndTeamRecord(
                    notification = NotificationTable.rowToNotificationRecord(it),
                    checkResult = CheckResultTable.rowToCheckResultRecord(it),
                    monitor = MonitorTable.rowToMonitorRecord(it),
                    team = TeamTable.rowToTeamRecord(it),
                )
            }.orThrowNotFound()

    @Transactional
    fun send(monitorId: ULong, checkResult: CheckResultRecord): NotificationJoinCheckResultMonitorAndTeamRecord {
        val notificationId = NotificationTable.insertAndGetId {
            it[NotificationTable.checkResultId] = checkResult.id
            it[NotificationTable.title] = checkResult.title!!
        }.value

        SubNotificationTable.batchInsert(notificationMethodService.getByMonitorId(monitorId)) { notificationMethod ->
            this[SubNotificationTable.notificationId] = notificationId
            this[SubNotificationTable.methodId] = notificationMethod.id
            this[SubNotificationTable.title] = checkResult.title!!
            this[SubNotificationTable.message] = checkResult.message
        }

        return getByIdJoinCheckResultMonitorAndTeam(notificationId)
    }

    fun getAllPaginated(
        pageable: Pageable,
        monitorId: ULong?,
        teamId: ULong?,
        userId: ULong?,
        statuses: List<MonitorStatus>?,
        start: Instant?,
        end: Instant?,
    ): Page<NotificationJoinCheckResultMonitorAndTeamRecord> = NotificationTable.findAll(
        pageable = pageable,
        monitorId = monitorId,
        teamId = teamId,
        userId = userId,
        statuses = statuses,
        start = start,
        end = end,
    )

    @Transactional
    fun deleteByTeamIdAndOlderThan(teamId: ULong, than: Instant): Int = NotificationTable.deleteByTeamIdAndOlderThan(
        teamId,
        than,
    )
}
