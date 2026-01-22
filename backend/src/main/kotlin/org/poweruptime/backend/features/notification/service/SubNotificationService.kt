package org.poweruptime.backend.features.notification.service

import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.amqp.RabbitMQService
import org.poweruptime.backend.core.domain.Page
import org.poweruptime.backend.core.domain.findByIdOrThrow
import org.poweruptime.backend.core.dto.Pageable
import org.poweruptime.backend.core.utils.orThrowNotFound
import org.poweruptime.backend.features.monitor.model.CheckResult
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.rowToCheckResultRecord
import org.poweruptime.backend.features.monitor.model.rowToMonitorRecord
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.domain.deleteByTeamIdAndOlderThan
import org.poweruptime.backend.features.notification.domain.findAll
import org.poweruptime.backend.features.notification.domain.findByNotificationId
import org.poweruptime.backend.features.notification.model.Notification
import org.poweruptime.backend.features.notification.model.NotificationMethod
import org.poweruptime.backend.features.notification.model.SubNotification
import org.poweruptime.backend.features.notification.model.SubNotificationJoinMethodAndNotificationRecord
import org.poweruptime.backend.features.notification.model.SubNotificationJoinMethodNotificationCheckResultAndMonitorRecord
import org.poweruptime.backend.features.notification.model.SubNotificationJoinMethodRecord
import org.poweruptime.backend.features.notification.model.SubNotificationRecord
import org.poweruptime.backend.features.notification.model.rowToNotificationMethodRecord
import org.poweruptime.backend.features.notification.model.rowToNotificationRecord
import org.poweruptime.backend.features.notification.model.rowToSubNotificationRecord
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
@Transactional(readOnly = true)
class SubNotificationService(private val rabbitMQService: RabbitMQService) {
    fun queueNotification(subNotificationId: ULong) {
        rabbitMQService.sendToProcessSubNotification(subNotificationId)
    }

    fun getById(subNotificationId: ULong): SubNotificationRecord = SubNotification.findByIdOrThrow(
        subNotificationId,
    ) {
        SubNotification.rowToSubNotificationRecord(it)
    }

    fun getByIdJoin(subNotificationId: ULong): SubNotificationJoinMethodNotificationCheckResultAndMonitorRecord =
        SubNotification
            .innerJoin(NotificationMethod)
            .innerJoin(Notification)
            .innerJoin(CheckResult)
            .innerJoin(Monitor, { Notification.monitorId }, { Monitor.id})
            .selectAll()
            .where {
                SubNotification.id eq subNotificationId
            }.limit(1)
            .firstOrNull()
            ?.let {
                SubNotificationJoinMethodNotificationCheckResultAndMonitorRecord(
                    subNotification = SubNotification.rowToSubNotificationRecord(it),
                    method = NotificationMethod.rowToNotificationMethodRecord(it),
                    notification = Notification.rowToNotificationRecord(it),
                    checkResult = CheckResult.rowToCheckResultRecord(it),
                    monitor = Monitor.rowToMonitorRecord(it),
                )
            }.orThrowNotFound()

    fun getByNotificationId(notificationId: ULong): List<SubNotificationJoinMethodRecord> =
        SubNotification.findByNotificationId(notificationId)

    fun getAllPaginated(
        pageable: Pageable,
        notificationId: ULong?,
        monitorId: ULong?,
        teamId: ULong?,
        userId: ULong?,
        methods: List<NotificationMethodType>?,
        statuses: List<MonitorStatus>?,
    ): Page<SubNotificationJoinMethodAndNotificationRecord> = SubNotification.findAll(
        pageable = pageable,
        notificationId = notificationId,
        monitorId = monitorId,
        teamId = teamId,
        userId = userId,
        methods = methods,
        statuses = statuses,
    )

    @Transactional
    fun deleteByTeamIdAndOlderThan(teamId: ULong, than: Instant): Int = SubNotification.deleteByTeamIdAndOlderThan(
        teamId,
        than,
    )
}
