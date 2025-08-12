package org.poweruptime.backend.features.notification.service

import me.dafnik.JpaSpecificationBuilder.buildSpecification
import org.poweruptime.backend.amqp.RabbitMQService
import org.poweruptime.backend.core.dto.validateSort
import org.poweruptime.backend.core.service.AEntityService
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.domain.SubNotificationRepository
import org.poweruptime.backend.features.notification.model.SubNotification
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class SubNotificationService(
    private val subNotificationRepository: SubNotificationRepository,
    private val rabbitMQService: RabbitMQService,
) : AEntityService<SubNotification>(subNotificationRepository) {

    fun queueNotification(notificationId: String) {
        rabbitMQService.sendToProcessNotification(notificationId)
    }

    fun getAllPaginated(
        pageable: Pageable,
        notificationId: String?,
        monitorId: String?,
        teamId: String?,
        userId: String?,
        methods: List<NotificationMethodType>?,
        statuses: List<MonitorStatus>?,
    ): Page<SubNotification> = subNotificationRepository.findAll(
        buildSpecification {
            distinct = true

            where {
                and {
                    require(userId != null || teamId != null || monitorId !== null || notificationId != null) {
                        "notificationId or teamId or monitorId or userId needs to be provided"
                    }
                    and {
                        notificationId?.let { col("notification.id") eq it }
                        teamId?.let { col("notification.checkResult.monitor.team.id") eq it }
                        monitorId?.let { col("notification.checkResult.monitor.id") eq it }
                        userId?.let { col("notification.checkResult.monitor.team.teamUsers.id.user.id") eq it }
                    }

                    and {
                        statuses?.ifEmpty { null }?.let { col("notification.checkResult.status") inList it }
                        methods?.ifEmpty { null }?.let { col(SubNotification::method) inList it }

                        if (teamId != null || userId != null) {
                            col("notification.checkResult.monitor.deleted").isNull()
                        }
                    }
                }
            }
        },
        pageable.validateSort("notification.checkResult.status", "method", "createdAt"),
    )

    fun deleteByTeamIdAndOlderThan(teamId: String, than: Instant) = subNotificationRepository.findByTeamIdAndOlderThan(
        teamId,
        than,
    ).apply {
        deleteAll(this)
    }
}
