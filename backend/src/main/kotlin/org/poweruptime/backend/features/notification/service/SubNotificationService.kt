package org.poweruptime.backend.features.notification.service

import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.amqp.RabbitMQService
import org.poweruptime.backend.core.domain.findByIdOrThrow
import org.poweruptime.backend.core.utils.orThrowNotFound
import org.poweruptime.backend.features.monitor.model.CheckResultTable
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.MonitorTable
import org.poweruptime.backend.features.monitor.model.rowToCheckResultRecord
import org.poweruptime.backend.features.monitor.model.rowToMonitorRecord
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.domain.deleteByTeamIdAndOlderThan
import org.poweruptime.backend.features.notification.domain.findAll
import org.poweruptime.backend.features.notification.domain.findByNotificationId
import org.poweruptime.backend.features.notification.model.NotificationMethodTable
import org.poweruptime.backend.features.notification.model.NotificationTable
import org.poweruptime.backend.features.notification.model.SubNotificationJoinMethodAndNotificationRecord
import org.poweruptime.backend.features.notification.model.SubNotificationJoinMethodNotificationCheckResultAndMonitorRecord
import org.poweruptime.backend.features.notification.model.SubNotificationJoinMethodRecord
import org.poweruptime.backend.features.notification.model.SubNotificationRecord
import org.poweruptime.backend.features.notification.model.SubNotificationTable
import org.poweruptime.backend.features.notification.model.rowToNotificationMethodRecord
import org.poweruptime.backend.features.notification.model.rowToNotificationRecord
import org.poweruptime.backend.features.notification.model.rowToSubNotificationRecord
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
@Transactional(readOnly = true)
class SubNotificationService(
    private val rabbitMQService: RabbitMQService,
) {
    fun queueNotification(subNotificationId: ULong) {
        rabbitMQService.sendToProcessSubNotification(subNotificationId)
    }

    fun getById(subNotificationId: ULong): SubNotificationRecord = SubNotificationTable.findByIdOrThrow(
        subNotificationId,
    ) {
        SubNotificationTable.rowToSubNotificationRecord(it)
    }

    fun getByIdJoin(subNotificationId: ULong): SubNotificationJoinMethodNotificationCheckResultAndMonitorRecord =
        SubNotificationTable
            .innerJoin(NotificationMethodTable)
            .innerJoin(NotificationTable)
            .innerJoin(CheckResultTable)
            .innerJoin(MonitorTable)
            .selectAll()
            .where {
                SubNotificationTable.id eq subNotificationId
            }.limit(1).firstOrNull()?.let {
                SubNotificationJoinMethodNotificationCheckResultAndMonitorRecord(
                    subNotification = SubNotificationTable.rowToSubNotificationRecord(it),
                    method = NotificationMethodTable.rowToNotificationMethodRecord(it),
                    notification = NotificationTable.rowToNotificationRecord(it),
                    checkResult = CheckResultTable.rowToCheckResultRecord(it),
                    monitor = MonitorTable.rowToMonitorRecord(it),
                )
            }.orThrowNotFound()

    fun getByNotificationId(notificationId: ULong): List<SubNotificationJoinMethodRecord> =
        SubNotificationTable.findByNotificationId(notificationId)

    fun getAllPaginated(
        pageable: Pageable,
        notificationId: ULong?,
        monitorId: ULong?,
        teamId: ULong?,
        userId: ULong?,
        methods: List<NotificationMethodType>?,
        statuses: List<MonitorStatus>?,
    ): Page<SubNotificationJoinMethodAndNotificationRecord> = SubNotificationTable.findAll(
        pageable = pageable,
        notificationId = notificationId,
        monitorId = monitorId,
        teamId = teamId,
        userId = userId,
        methods = methods,
        statuses = statuses,
    )

    @Transactional
    fun deleteByTeamIdAndOlderThan(teamId: ULong, than: Instant): Int = SubNotificationTable.deleteByTeamIdAndOlderThan(
        teamId,
        than,
    )
}
