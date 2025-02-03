package org.poweruptime.backend.features.statusPage.service

import jakarta.persistence.criteria.CriteriaBuilder
import jakarta.persistence.criteria.CriteriaQuery
import jakarta.persistence.criteria.Root
import jakarta.transaction.Transactional
import org.poweruptime.backend.core.Filter
import org.poweruptime.backend.core.FilterCompare
import org.poweruptime.backend.core.dto.PageableValidator
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.core.exceptions.NotFoundException
import org.poweruptime.backend.core.service.ASoftDeleteEntityService
import org.poweruptime.backend.core.toDeletedFilter
import org.poweruptime.backend.core.toPredicate
import org.poweruptime.backend.features.monitor.service.MonitorService
import org.poweruptime.backend.features.statusPage.domain.StatusPageGroupMonitorRepository
import org.poweruptime.backend.features.statusPage.domain.StatusPageRepository
import org.poweruptime.backend.features.statusPage.dto.CreateStatusPageDto
import org.poweruptime.backend.features.statusPage.dto.UpdateStatusPageDto
import org.poweruptime.backend.features.statusPage.dto.fromDto
import org.poweruptime.backend.features.statusPage.dto.update
import org.poweruptime.backend.features.statusPage.model.StatusPage
import org.poweruptime.backend.features.statusPage.model.StatusPageGroup
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupMonitor
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupMonitorId
import org.poweruptime.backend.features.team.service.TeamService
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service

@Service
class StatusPageService(
    private val statusPageRepository: StatusPageRepository,
    private val statusPageGroupMonitorRepository: StatusPageGroupMonitorRepository,
    private val statusPageGroupService: StatusPageGroupService,
    private val monitorService: MonitorService,
    private val teamService: TeamService,
) : ASoftDeleteEntityService<StatusPage>(statusPageRepository) {
    @Transactional
    fun create(dto: CreateStatusPageDto): StatusPage {
        val allMonitorIds = dto.groups.flatMap { it.monitorIds }

        // Check for unique monitor
        if (allMonitorIds.toSet().size != allMonitorIds.size) {
            throw BadRequestException("All monitor ids should be unique")
        }
        val monitors = monitorService.getByIdOrThrow(allMonitorIds).associateBy { it.id }

        if (!monitorService.ensureAllMonitorsInTeam(monitors.values, dto.teamId)) {
            throw BadRequestException("All monitors should be in the same team as of status page")
        }

        val statusPage = save(StatusPage.fromDto(dto, teamService.getByIdOrThrow(dto.teamId)))

        val groups = statusPageGroupService.saveAll(
            dto.groups.mapIndexed { index, groupDto ->
                StatusPageGroup.fromDto(groupDto, index, statusPage)
            },
        )

        dto.groups.forEachIndexed { groupIndex, groupDto ->
            statusPageGroupMonitorRepository.saveAll(
                groupDto.monitorIds.mapIndexed { index, monitorId ->
                    StatusPageGroupMonitor(
                        connection = StatusPageGroupMonitorId(
                            group = groups[groupIndex],
                            monitor = monitors[monitorId] ?: throw NotFoundException(),
                        ),
                        statusPage = statusPage,
                        position = index,
                    )
                },
            )
        }

        return statusPage.apply {
            this.groups = groups
        }
    }

    @Transactional
    fun update(dto: UpdateStatusPageDto): StatusPage {
        val allMonitorIds = dto.groups.flatMap { it.monitorIds }

        // Check for unique monitor
        if (allMonitorIds.toSet().size != allMonitorIds.size) {
            throw BadRequestException("All monitor ids should be unique")
        }
        val monitors = monitorService.getByIdOrThrow(allMonitorIds).associateBy { it.id }

        val oldStatusPage = getByIdOrThrow(dto.id)

        if (!monitorService.ensureAllMonitorsInTeam(monitors.values, oldStatusPage.team.id)) {
            throw BadRequestException("All monitors should be in the same team as the status page")
        }

        val statusPage = save(oldStatusPage.update(dto))

        statusPageGroupMonitorRepository.deleteAll(statusPage.groupMonitors)
        statusPageGroupService.deleteAll(statusPage.groups)

        statusPageGroupMonitorRepository.flush()
        statusPageGroupService.flush()

        val groups = statusPageGroupService.saveAll(
            dto.groups.mapIndexed { index, groupDto ->
                StatusPageGroup.fromDto(groupDto, index, statusPage)
            },
        )

        dto.groups.forEachIndexed { groupIndex, groupDto ->
            statusPageGroupMonitorRepository.saveAll(
                groupDto.monitorIds.mapIndexed { index, monitorId ->
                    StatusPageGroupMonitor(
                        connection = StatusPageGroupMonitorId(
                            group = groups[groupIndex],
                            monitor = monitors[monitorId] ?: throw NotFoundException(),
                        ),
                        statusPage = statusPage,
                        position = index,
                    )
                },
            )
        }

        return statusPage.apply {
            this.groups = groups
        }
    }

    fun getBySlug(slug: String): StatusPage? = statusPageRepository.findBySlug(slug)
    fun getByDomainName(domainName: String): StatusPage? = statusPageRepository.findByDomainName(domainName)

    fun getAllPaginated(
        pageable: Pageable,
        teamId: String,
        name: String?,
        deleted: Boolean = false
    ): Page<StatusPage> = statusPageRepository.findAll(
        { root: Root<StatusPage>, _: CriteriaQuery<*>?, criteriaBuilder: CriteriaBuilder ->
            fun getTeamIdPredicate() = (
                Filter("team.id", teamId, FilterCompare.EQ)
                ).toPredicate(root, criteriaBuilder)

            fun getFilterPredicates() = criteriaBuilder.and(
                *buildList {
                    add(deleted.toDeletedFilter())
                    name?.let { add(Filter("name", it, FilterCompare.LIKE)) }
                }.toPredicate(root, criteriaBuilder).toTypedArray(),
            )

            criteriaBuilder.and(
                *buildList {
                    add(getTeamIdPredicate())

                    add(getFilterPredicates())
                }.toTypedArray(),
            )
        },
        PageableValidator.validateSort(
            pageable,
            listOf("name", "slug", "createdAt", "updatedAt"),
        ),
    )
}
