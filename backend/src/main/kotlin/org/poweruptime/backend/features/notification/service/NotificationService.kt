package org.poweruptime.backend.features.notification.service

import jakarta.transaction.Transactional
import me.dafnik.JpaSpecificationBuilder.buildSpecification
import org.poweruptime.backend.core.dto.validateSort
import org.poweruptime.backend.core.service.AEntityService
import org.poweruptime.backend.features.monitor.model.CheckResult
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.domain.NotificationRepository
import org.poweruptime.backend.features.notification.model.Notification
import org.poweruptime.backend.features.notification.model.SubNotification
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class NotificationService(
    private val notificationRepository: NotificationRepository,
    private val subNotificationService: SubNotificationService,
) : AEntityService<Notification>(notificationRepository) {

    @Transactional
    fun send(monitor: Monitor, checkResult: CheckResult): Notification {
        val notification = repository.save(
            Notification(
                checkResult = checkResult,
                title = checkResult.title!!,
            ),
        )

        val subs = monitor.enabledNotificationMethods.map { method ->
            SubNotification(
                notification = notification,
                method = method,
                title = checkResult.title!!,
                message = checkResult.message,
            )
        }

        notification.subNotifications = subNotificationService.saveAll(subs)
        return notification
    }

    fun getAllPaginated(
        pageable: Pageable,
        monitorId: String?,
        teamId: String?,
        userId: String?,
        methods: List<NotificationMethodType>?,
        statuses: List<MonitorStatus>?,
    ): Page<Notification> = notificationRepository.findAll(
        buildSpecification {
            distinct = true

            where {
                and {
                    require(
                        userId != null || teamId != null || monitorId !== null,
                    ) { "teamId or monitorId or userId needs to be provided" }
                    and {
                        teamId?.let { col("checkResult.monitor.team.id") eq it }
                        monitorId?.let { col("checkResult.monitor.id") eq it }
                        userId?.let { col("checkResult.monitor.team.teamUsers.id.user.id") eq it }
                    }

                    and {
                        statuses?.ifEmpty { null }?.let { col("checkResult.status") inList it }
                        methods?.ifEmpty { null }?.let { col("subNotifications.method.data._type") inList it }

                        if (teamId != null || userId != null) {
                            col("checkResult.monitor.deleted").isNull()
                        }
                    }
                }
            }
        },
        pageable.validateSort("checkResult.status", "createdAt"),
    )

    fun deleteByTeamIdAndOlderThan(teamId: String, than: Instant) = notificationRepository.findByTeamIdAndOlderThan(
        teamId,
        than,
    ).apply {
        deleteAll(this)
    }
}
