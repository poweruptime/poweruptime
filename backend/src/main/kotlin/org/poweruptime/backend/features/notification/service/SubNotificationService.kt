package org.poweruptime.backend.features.notification.service

import jakarta.persistence.criteria.CriteriaBuilder
import jakarta.persistence.criteria.CriteriaQuery
import jakarta.persistence.criteria.Root
import org.poweruptime.backend.amqp.RabbitMQService
import org.poweruptime.backend.core.Filter
import org.poweruptime.backend.core.FilterCompare
import org.poweruptime.backend.core.dto.PageableValidator
import org.poweruptime.backend.core.service.AEntityService
import org.poweruptime.backend.core.toPredicate
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
        { root: Root<SubNotification>, query: CriteriaQuery<*>?, criteriaBuilder: CriteriaBuilder ->
            assert(
                (userId !== null && teamId == null && monitorId == null && notificationId == null) ||
                    (userId === null && teamId != null && monitorId == null && notificationId == null) ||
                    (userId === null && teamId == null && monitorId != null && notificationId == null) ||
                    (userId === null && teamId == null && monitorId == null && notificationId != null),
            )

            query?.distinct(true)

            val idPredicate = when {
                notificationId != null -> Filter("notification.id", notificationId, FilterCompare.EQ)
                teamId != null -> Filter("notification.checkResult.monitor.team.id", teamId, FilterCompare.EQ)
                monitorId != null -> Filter("notification.checkResult.monitor.id", monitorId, FilterCompare.EQ)
                userId != null -> Filter(
                    "notification.checkResult.monitor.team.teamUsers.id.user.id",
                    userId,
                    FilterCompare.EQ,
                )
                else -> throw AssertionError("notificationId or teamId or monitorId or userId needs to be provided")
            }.toPredicate(root, criteriaBuilder)

            val filterPredicates = if (
                !methods.isNullOrEmpty() ||
                !statuses.isNullOrEmpty() ||
                teamId != null ||
                userId != null
            ) {
                criteriaBuilder.and(
                    *buildList {
                        statuses?.let { add(Filter("notification.checkResult.status", it, FilterCompare.IN)) }
                        methods?.let { add(Filter("method", it, FilterCompare.IN)) }
                        if (teamId != null || userId != null) {
                            add(Filter("notification.checkResult.monitor.deleted", "", FilterCompare.IS_NULL))
                        }
                    }.toPredicate(root, criteriaBuilder).toTypedArray(),
                )
            } else {
                null
            }

            if (filterPredicates != null) {
                criteriaBuilder.and(idPredicate, filterPredicates)
            } else {
                idPredicate
            }
        },
        PageableValidator.validateSort(
            pageable,
            listOf("notification.checkResult.status", "method", "createdAt"),
        ),
    )

    fun deleteByTeamIdAndOlderThan(teamId: String, than: Instant) = subNotificationRepository.findByTeamIdAndOlderThan(
        teamId,
        than,
    ).apply {
        deleteAll(this)
    }
}
