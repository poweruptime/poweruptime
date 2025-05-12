package org.poweruptime.backend.features.notification.service

import jakarta.persistence.criteria.CriteriaBuilder
import jakarta.persistence.criteria.CriteriaQuery
import jakarta.persistence.criteria.Root
import org.poweruptime.backend.core.*
import org.poweruptime.backend.core.dto.PageableValidator
import org.poweruptime.backend.core.service.ASoftDeleteEntityService
import org.poweruptime.backend.features.notification.core.NotificationSenderType
import org.poweruptime.backend.features.notification.domain.NotificationMethodRepository
import org.poweruptime.backend.features.notification.dto.*
import org.poweruptime.backend.features.notification.model.NotificationMethod
import org.poweruptime.backend.features.team.service.TeamService
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service

@Service
class NotificationMethodService(
    private val notificationMethodRepository: NotificationMethodRepository,
    private val notificationSenderDataService: NotificationSenderDataService,
    private val teamService: TeamService,
) : ASoftDeleteEntityService<NotificationMethod>(notificationMethodRepository) {
    fun create(dto: CreateNotificationMethodDto): NotificationMethod = save(
        NotificationMethod.fromDto(
            dto = dto,
            team = teamService.getByIdOrThrow(dto.teamId),
            notificationSenderDataService.save(dto.sender),
        ),
    )

    fun update(dto: UpdateNotificationMethodDto): NotificationMethod = getByIdOrThrow(dto.id).let {
        val oldSenderId = it.sender.id
        val newSender = notificationSenderDataService.save(dto.sender)

        val notificationMethod = notificationMethodRepository.saveAndFlush(it.update(dto, newSender))

        notificationSenderDataService.deleteByIdOrThrow(oldSenderId)

        notificationMethod
    }

    override fun deleteByIdOrThrow(id: String) {
        val notificationMethod = getByIdOrThrow(id)
        super.deleteByIdOrThrow(id)

        notificationSenderDataService.deleteByIdOrThrow(notificationMethod.sender.id)
    }

    override fun undeleteById(id: String): NotificationMethod = super.undeleteById(id).let {
        notificationSenderDataService.undeleteById(it.sender.id)
        it
    }

    fun getAllPaginated(
        pageable: Pageable,
        teamId: String,
        name: String?,
        types: List<NotificationSenderType>?,
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

    fun ensureAllNotificationMethodsInTeam(notificationMethods: List<NotificationMethod>, teamId: String) =
        notificationMethods.all { it.team.id == teamId }
}
