package org.poweruptime.backend.features.notification.service

import jakarta.persistence.criteria.CriteriaBuilder
import jakarta.persistence.criteria.CriteriaQuery
import jakarta.persistence.criteria.Root
import org.poweruptime.backend.core.*
import org.poweruptime.backend.core.domain.findByIdOrThrow
import org.poweruptime.backend.core.dto.PageableValidator
import org.poweruptime.backend.core.service.ASoftDeleteEntityService
import org.poweruptime.backend.core.utils.NANO_ID_MAX_LENGTH
import org.poweruptime.backend.core.utils.NANO_ID_SMALL_LENGTH
import org.poweruptime.backend.core.utils.RandomGenerator
import org.poweruptime.backend.features.authentication.domain.ensureAllInTeam
import org.poweruptime.backend.features.monitor.checker.ping.PingMonitorData
import org.poweruptime.backend.features.monitor.domain.MonitorRepository
import org.poweruptime.backend.features.monitor.model.CheckResult
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.notification.AppriseSender
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.domain.NotificationMethodRepository
import org.poweruptime.backend.features.notification.dto.*
import org.poweruptime.backend.features.notification.model.Notification
import org.poweruptime.backend.features.notification.model.NotificationMethod
import org.poweruptime.backend.features.notification.model.SubNotification
import org.poweruptime.backend.features.team.domain.TeamRepository
import org.poweruptime.backend.features.team.model.Team
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class NotificationMethodService(
    private val notificationMethodRepository: NotificationMethodRepository,
    private val notificationMethodDataService: NotificationMethodDataService,
    private val teamRepository: TeamRepository,
    private val monitorRepository: MonitorRepository,
    private val appriseSender: AppriseSender,
) : ASoftDeleteEntityService<NotificationMethod>(notificationMethodRepository) {

    fun create(dto: CreateNotificationMethodDto): NotificationMethod = save(
        NotificationMethod.fromDto(
            dto = dto,
            team = teamRepository.findByIdOrThrow(dto.teamId),
            attachedSender = notificationMethodDataService.save(dto.sender),
            monitors = monitorRepository.findByIdOrThrow(
                dto.monitorIds,
            ).ensureAllInTeam(dto.teamId) { monitor -> monitor.team.id },
        ),
    ).apply {
        if (dto.testSend) {
            appriseSender.send(this.getTestSubNotification())
        }
    }

    fun update(dto: UpdateNotificationMethodDto): NotificationMethod = getByIdOrThrow(dto.id).let {
        val oldSenderId = it.data.id
        val newSender = notificationMethodDataService.save(dto.sender)

        val notificationMethod = notificationMethodRepository.saveAndFlush(
            it.update(
                dto,
                attachedSender = newSender,
                monitors = monitorRepository.findByIdOrThrow(
                    dto.monitorIds,
                ).ensureAllInTeam(it.team.id) { monitor -> monitor.team.id },
            ),
        )

        notificationMethodDataService.deleteByIdOrThrow(oldSenderId)

        if (dto.testSend) {
            appriseSender.send(notificationMethod.getTestSubNotification())
        }

        notificationMethod
    }

    override fun deleteByIdOrThrow(id: String) {
        val notificationMethod = getByIdOrThrow(id)
        super.deleteByIdOrThrow(id)

        notificationMethodDataService.deleteByIdOrThrow(notificationMethod.data.id)
    }

    override fun undeleteById(id: String): NotificationMethod = super.undeleteById(id).let {
        notificationMethodDataService.undeleteById(it.data.id)
        it
    }

    fun getAllPaginated(
        pageable: Pageable,
        teamId: String,
        name: String?,
        types: List<NotificationMethodType>?,
        useByDefault: Boolean?,
        deleted: Boolean = false,
    ): Page<NotificationMethod> = notificationMethodRepository.findAll(
        { root: Root<NotificationMethod>, _: CriteriaQuery<*>?, criteriaBuilder: CriteriaBuilder ->
            fun getFilterPredicates() = criteriaBuilder.and(
                *buildList {
                    add(deleted.toDeletedFilter())
                    types?.let { add(Filter("sender._type", it, FilterCompare.IN)) }
                    useByDefault?.let { add(Filter("useByDefault", it, FilterCompare.EQ)) }
                    name?.let { add(Filter("name", it, FilterCompare.LIKE)) }
                }.toPredicate(root, criteriaBuilder).toTypedArray(),
            )

            criteriaBuilder.and(
                *buildList {
                    add(Filter("team.id", teamId, FilterCompare.EQ).toPredicate(root, criteriaBuilder))

                    add(getFilterPredicates())
                }.toTypedArray(),
            )
        },
        PageableValidator.validateSort(
            pageable,
            listOf("name", "useByDefault", "sender._type", "createdAt", "deleted"),
        ),
    )

    private fun NotificationMethod.getTestSubNotification(): SubNotification {
        val title = "Notification method test"
        val body = "Detailed message :)"
        val status = MonitorStatus.MAINTENANCE
        val teamName = "Demo Team"
        val monitorName = "Demo Monitor"
        return SubNotification(
            method = this,
            title = title,
            message = body,
            pickedUpAt = Instant.now(),
            notification = Notification(
                title = title,
                checkResult = CheckResult(
                    status = status,
                    previousStatus = status,
                    pickedUpAt = Instant.now(),
                    checkedAt = Instant.now(),
                    pingMs = 420,
                    title = title,
                    message = body,
                    monitor = Monitor(
                        name = monitorName,
                        testIntervalSeconds = 30,
                        retries = 3,
                        upsideDown = false,
                        checker = PingMonitorData(
                            "1.1.1.1",
                            443,
                        ),
                        team = Team(
                            name = teamName,
                        ).apply {
                            id = RandomGenerator.nanoId(NANO_ID_SMALL_LENGTH)
                        },
                    ).apply {
                        id = RandomGenerator.nanoId(NANO_ID_MAX_LENGTH)
                    },
                ).apply {
                    id = RandomGenerator.nanoId(NANO_ID_MAX_LENGTH)
                },
            ).apply {
                id = RandomGenerator.nanoId(NANO_ID_MAX_LENGTH)
            },
        ).apply {
            id = RandomGenerator.nanoId(NANO_ID_MAX_LENGTH)
        }
    }
}
