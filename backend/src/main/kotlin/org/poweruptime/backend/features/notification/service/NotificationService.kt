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
import org.poweruptime.backend.features.notification.core.NotificationSenderType
import org.poweruptime.backend.features.notification.domain.NotificationRepository
import org.poweruptime.backend.features.notification.model.Notification
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service

@Service
class NotificationService(
    private val notificationRepository: NotificationRepository,
    private val rabbitMQService: RabbitMQService,
) : AEntityService<Notification>(notificationRepository) {

    fun queueNotification(notificationId: String) {
        rabbitMQService.sendToProcessNotification(notificationId)
    }

    fun getAllPaginated(
        pageable: Pageable,
        monitorId: String?,
        teamId: String?,
        userId: String?,
        methods: List<NotificationSenderType>?,
        statuses: List<MonitorStatus>?,
    ): Page<Notification> = notificationRepository.findAll(
        { root: Root<Notification>, query: CriteriaQuery<*>?, criteriaBuilder: CriteriaBuilder ->
            assert(
                (userId !== null && teamId == null && monitorId == null) ||
                    (userId === null && teamId != null && monitorId == null) ||
                    (userId === null && teamId == null && monitorId != null),
            )

            query?.distinct(true)

            val idPredicate = when {
                teamId != null -> Filter("checkResult.monitor.team.id", teamId, FilterCompare.EQ)
                monitorId != null -> Filter("checkResult.monitor.id", monitorId, FilterCompare.EQ)
                userId != null -> Filter("checkResult.monitor.team.teamUsers.id.user.id", userId, FilterCompare.EQ)
                else -> throw AssertionError("teamId or monitorId or userId needs to be provided")
            }.toPredicate(root, criteriaBuilder)

            val filterPredicates = if (
                !methods.isNullOrEmpty() ||
                !statuses.isNullOrEmpty() ||
                teamId != null ||
                userId != null
            ) {
                criteriaBuilder.and(
                    *buildList {
                        statuses?.let { add(Filter("checkResult.status", it, FilterCompare.IN)) }
                        methods?.let { add(Filter("method", it, FilterCompare.IN)) }
                        if (teamId != null || userId != null) {
                            add(Filter("checkResult.monitor.deleted", "", FilterCompare.IS_NULL))
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
            listOf("checkResult.status", "method", "createdAt"),
        ),
    )
}
