package org.poweruptime.backend.features.statusPage.service

import jakarta.transaction.Transactional
import me.dafnik.JpaSpecificationBuilder.buildSpecification
import org.poweruptime.backend.core.colDeleted
import org.poweruptime.backend.core.dto.validateSort
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.core.service.ASoftDeleteEntityService
import org.poweruptime.backend.core.utils.orThrowNotFound
import org.poweruptime.backend.features.fileUpload.FileService
import org.poweruptime.backend.features.monitor.service.MonitorService
import org.poweruptime.backend.features.statusPage.domain.StatusPageDomainNameRepository
import org.poweruptime.backend.features.statusPage.domain.StatusPageGroupMonitorRepository
import org.poweruptime.backend.features.statusPage.domain.StatusPageRepository
import org.poweruptime.backend.features.statusPage.dto.CreateStatusPageDto
import org.poweruptime.backend.features.statusPage.dto.UpdateStatusPageDto
import org.poweruptime.backend.features.statusPage.dto.fromDto
import org.poweruptime.backend.features.statusPage.dto.update
import org.poweruptime.backend.features.statusPage.model.StatusPage
import org.poweruptime.backend.features.statusPage.model.StatusPageDomainName
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
    private val statusPageDomainNameRepository: StatusPageDomainNameRepository,
    private val statusPageGroupService: StatusPageGroupService,
    private val monitorService: MonitorService,
    private val teamService: TeamService,
    private val fileService: FileService,
) : ASoftDeleteEntityService<StatusPage>(statusPageRepository) {
    @Transactional
    fun create(dto: CreateStatusPageDto): StatusPage {
        val allMonitorIds = dto.groups.flatMap { it.monitorIds }

        // Check for unique monitor
        if (allMonitorIds.toSet().size != allMonitorIds.size) {
            throw BadRequestException("All monitor ids should be unique")
        }

        if (getBySlug(dto.slug) != null) {
            throw BadRequestException("Slug ${dto.slug} already used", "slug_in_use")
        }

        val monitors = monitorService.getByIdOrThrow(allMonitorIds).associateBy { it.id }

        if (!monitorService.ensureAllMonitorsInTeam(monitors.values, dto.teamId)) {
            throw BadRequestException("All monitors should be in the same team as of status page")
        }

        val statusPage = save(
            StatusPage.fromDto(
                dto,
                teamService.getByIdOrThrow(dto.teamId),
                dto.imageId?.let {
                    fileService.getByFileId(it).orThrowNotFound("Image not found")
                },
            ),
        )

        val domainNames = statusPageDomainNameRepository.saveAll(
            dto.domainNames.map { StatusPageDomainName(it, statusPage) },
        )

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
                            monitor = monitors[monitorId].orThrowNotFound(),
                        ),
                        statusPage = statusPage,
                        position = index,
                    )
                },
            )
        }

        return statusPage.apply {
            this.groups = groups
            this.domainNames = domainNames
        }
    }

    @Transactional
    fun update(dto: UpdateStatusPageDto): StatusPage {
        val allMonitorIds = dto.groups.flatMap { it.monitorIds }

        // Check for unique monitor
        if (allMonitorIds.toSet().size != allMonitorIds.size) {
            throw BadRequestException("All monitor ids should be unique")
        }

        val oldStatusPage = getByIdOrThrow(dto.id)

        if (oldStatusPage.slug != dto.slug) {
            if (getBySlug(dto.slug) != null) {
                throw BadRequestException("Slug ${dto.slug} already used", "slug_in_use")
            }
        }

        val monitors = monitorService.getByIdOrThrow(allMonitorIds).associateBy { it.id }

        if (!monitorService.ensureAllMonitorsInTeam(monitors.values, oldStatusPage.team.id)) {
            throw BadRequestException("All monitors should be in the same team as the status page")
        }

        val statusPage = save(
            oldStatusPage.update(
                dto,
                dto.imageId?.let {
                    fileService.getByFileId(it).orThrowNotFound("Image not found")
                },
            ),
        )

        statusPageDomainNameRepository.deleteAll(statusPage.domainNames)
        statusPageGroupMonitorRepository.deleteAll(statusPage.groupMonitors)
        statusPageGroupService.deleteAll(statusPage.groups)

        statusPageDomainNameRepository.flush()
        statusPageGroupMonitorRepository.flush()
        statusPageGroupService.flush()

        val domainNames = statusPageDomainNameRepository.saveAll(
            dto.domainNames.map { StatusPageDomainName(it, statusPage) },
        )

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
                            monitor = monitors[monitorId].orThrowNotFound(),
                        ),
                        statusPage = statusPage,
                        position = index,
                    )
                },
            )
        }

        return statusPage.apply {
            this.groups = groups
            this.domainNames = domainNames
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
        buildSpecification {
            where {
                and {
                    col("team.id") eq teamId

                    and {
                        colDeleted(deleted)
                        name?.let { col(StatusPage::name) lowercaseLike "%$it%" }
                    }
                }
            }
        },
        pageable.validateSort("name", "slug", "createdAt", "updatedAt", "deleted"),
    )
}
