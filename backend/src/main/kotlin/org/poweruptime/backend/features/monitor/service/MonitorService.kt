package org.poweruptime.backend.features.monitor.service

import jakarta.persistence.criteria.CriteriaBuilder
import jakarta.persistence.criteria.CriteriaQuery
import jakarta.persistence.criteria.Root
import org.poweruptime.backend.core.*
import org.poweruptime.backend.core.domain.findByIdOrThrow
import org.poweruptime.backend.core.dto.PageableValidator
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.core.service.ASoftDeleteEntityService
import org.poweruptime.backend.features.authentication.domain.ensureAllInTeam
import org.poweruptime.backend.features.monitor.MonitorScheduler
import org.poweruptime.backend.features.monitor.domain.MonitorRepository
import org.poweruptime.backend.features.monitor.dto.CreateMonitorDto
import org.poweruptime.backend.features.monitor.dto.MonitorDashboardResponse
import org.poweruptime.backend.features.monitor.dto.UpdateMonitorDto
import org.poweruptime.backend.features.monitor.dto.fromDto
import org.poweruptime.backend.features.monitor.dto.update
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.MonitorData
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.MonitorType
import org.poweruptime.backend.features.notification.domain.NotificationMethodRepository
import org.poweruptime.backend.features.tag.TagService
import org.poweruptime.backend.features.team.domain.TeamRepository
import org.poweruptime.backend.features.team.model.Team
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service

@Service
class MonitorService(
    private val monitorRepository: MonitorRepository,
    private val teamRepository: TeamRepository,
    private val monitorScheduler: MonitorScheduler,
    private val monitorDataService: MonitorDataService,
    private val notificationMethodRepository: NotificationMethodRepository,
    private val tagService: TagService,
) : ASoftDeleteEntityService<Monitor>(monitorRepository) {
    fun create(dto: CreateMonitorDto): Monitor {
        val team = teamRepository.findByIdOrThrow(dto.teamId)

        return save(
            Monitor.fromDto(
                it = dto,
                team = team,
                notificationMethods = notificationMethodRepository.findByIdOrThrow(
                    dto.notificationMethodIds,
                ).ensureAllInTeam(dto.teamId) { notificationMethod -> notificationMethod.team.id },
                tags = tagService.getByTeamIdAndNames(team, dto.tags),
                attachedChecker = monitorDataService.save(dto.checker),
            ),
        ).start()
    }

    fun update(dto: UpdateMonitorDto): Monitor = getByIdOrThrow(dto.id).let {
        val oldCheckerId = it.checker.id
        val newChecker = monitorDataService.save(dto.checker)

        val monitor = monitorRepository.saveAndFlush(
            it.update(
                it = dto,
                notificationMethods = notificationMethodRepository.findByIdOrThrow(
                    dto.notificationMethodIds,
                ).ensureAllInTeam(it.team.id) { notificationMethod -> notificationMethod.team.id },
                tags = tagService.getByTeamIdAndNames(it.team, dto.tags),
                attachedChecker = newChecker,
            ),
        ).stop().start()

        monitorDataService.finalDeleteById(oldCheckerId)

        monitor
    }

    fun clone(monitor: Monitor, teamId: String? = null): Monitor = save(
        monitor.clone(
            attachedCheckerData = monitorDataService.save(monitor.checker.clone()),
            team = teamId?.let { teamRepository.findByIdOrThrow(it) },
        ),
    ).start()

    fun updateStatus(monitorId: String, status: MonitorStatus): Int = monitorRepository.updateStatus(monitorId, status)

    override fun deleteById(id: String) {
        deleteByIdOrThrow(id)
    }

    override fun deleteByIdOrThrow(id: String) {
        monitorScheduler.stop(id)
        val monitor = getByIdOrThrow(id)
        super.deleteByIdOrThrow(id)

        monitorDataService.deleteByIdOrThrow(monitor.checker.id)
    }

    override fun undeleteById(id: String): Monitor = super.undeleteById(id).let {
        monitorDataService.undeleteById(it.checker.id)
        it.start()
        it
    }

    fun pause(id: String): Monitor = getByIdOrThrow(id).let {
        it.stop()
        it.status = MonitorStatus.PAUSED
        save(it)
    }

    fun maintenance(id: String): Monitor = getByIdOrThrow(id).let {
        it.status = MonitorStatus.MAINTENANCE
        save(it)
    }

    fun start(id: String): Monitor = getByIdOrThrow(id).let {
        if (it.status !== MonitorStatus.MAINTENANCE && it.status !== MonitorStatus.PAUSED) {
            throw BadRequestException("Monitor can only be start if it's paused or in maintenance")
        }

        it.status = MonitorStatus.PENDING
        save(it).let { saved ->
            it.start()
            saved
        }
    }

    fun getIdsByTeamId(teamId: String) = monitorRepository.findIdsByTeamId(teamId)

    fun getAllPaginated(
        pageable: Pageable,
        teamId: String? = null,
        userId: String? = null,
        statusPageSlug: String? = null,
        name: String? = null,
        enabledNotificationMethodIds: List<String>? = null,
        statuses: List<MonitorStatus>? = null,
        types: List<MonitorType>? = null,
        tags: List<String>? = null,
        usedInStatusPageGroupIds: List<String>? = null,
        deleted: Boolean = false
    ): Page<Monitor> = monitorRepository.findAll(
        { root: Root<Monitor>, _: CriteriaQuery<*>?, criteriaBuilder: CriteriaBuilder ->
            fun getTeamOrUserIdPredicate() = (
                teamId?.let {
                    Filter("team.id", it, FilterCompare.EQ)
                } ?: userId?.let {
                    Filter("team.teamUsers.id.user.id", it, FilterCompare.EQ)
                } ?: statusPageSlug?.let {
                    Filter("groupMonitors.connection.group.statusPage.slug", statusPageSlug, FilterCompare.EQ)
                } ?: throw AssertionError("teamId or userId needs to be provided")
                ).toPredicate(root, criteriaBuilder)

            fun getFilterPredicates() = criteriaBuilder.and(
                *buildList {
                    add(deleted.toDeletedFilter())
                    enabledNotificationMethodIds?.let {
                        add(
                            Filter(
                                "enabledNotificationMethods.id",
                                it,
                                FilterCompare.IN,
                            ),
                        )
                    }
                    usedInStatusPageGroupIds?.let {
                        add(
                            Filter(
                                "groupMonitors.connection.group.id",
                                it,
                                FilterCompare.IN,
                            ),
                        )
                    }
                    statuses?.let { add(Filter("status", it, FilterCompare.IN)) }
                    types?.let { add(Filter("checker._type", it, FilterCompare.IN)) }
                    tags?.let { add(Filter("selectedTags.name", it, FilterCompare.IN)) }
                    name?.let { add(Filter("name", it, FilterCompare.LIKE)) }
                }.toPredicate(root, criteriaBuilder).toTypedArray(),
            )

            criteriaBuilder.and(
                *buildList {
                    add(getTeamOrUserIdPredicate())

                    add(getFilterPredicates())
                }.toTypedArray(),
            )
        },
        PageableValidator.validateSort(
            pageable,
            listOf(
                "name",
                "status",
                "testIntervalSeconds",
                "retries",
                "deleted",
                "createdAt",
                "groupMonitors.position",
                "team.name",
            ),
        ),
    )

    fun ensureAllMonitorsInTeam(monitors: Collection<Monitor>, teamId: String) = monitors.all { it.team.id == teamId }

    fun startAll(): List<Monitor> = monitorRepository.findAllNoneDeleted().map {
        it.apply {
            status = when (it.status) {
                MonitorStatus.PENDING,
                MonitorStatus.DOWN,
                MonitorStatus.UP -> MonitorStatus.PENDING
                MonitorStatus.MAINTENANCE,
                MonitorStatus.PAUSED -> it.status
            }
        }
        it.start(true)
    }.apply {
        saveAll(this)
    }

    private fun Monitor.start(booting: Boolean = false): Monitor = apply {
        monitorScheduler.start(this, booting)
    }

    private fun Monitor.stop(): Monitor = apply {
        monitorScheduler.stop(this.id)
    }

    fun getUserDashboard(
        userId: String,
    ) = MonitorDashboardResponse(
        monitorCount = monitorRepository.countMonitorsByUserEmail(userId),
        upCount = monitorRepository.countMonitorsByUserEmailAndStatus(userId, MonitorStatus.UP),
        downCount = monitorRepository.countMonitorsByUserEmailAndStatus(userId, MonitorStatus.DOWN),
        maintenanceCount = monitorRepository.countMonitorsByUserEmailAndStatus(userId, MonitorStatus.MAINTENANCE),
        pausedCount = monitorRepository.countMonitorsByUserEmailAndStatus(userId, MonitorStatus.PAUSED),
    )

    fun getTeamDashboard(
        teamId: String,
    ) = MonitorDashboardResponse(
        monitorCount = monitorRepository.countMonitorsByTeamId(teamId),
        upCount = monitorRepository.countMonitorsByTeamIdAndStatus(teamId, MonitorStatus.UP),
        downCount = monitorRepository.countMonitorsByTeamIdAndStatus(teamId, MonitorStatus.DOWN),
        maintenanceCount = monitorRepository.countMonitorsByTeamIdAndStatus(teamId, MonitorStatus.MAINTENANCE),
        pausedCount = monitorRepository.countMonitorsByTeamIdAndStatus(teamId, MonitorStatus.PAUSED),
    )
}

private fun Monitor.clone(
    attachedCheckerData: MonitorData,
    team: Team?
) = Monitor(
    name = """$name (Copy)""",
    testIntervalSeconds = testIntervalSeconds,
    upsideDown = upsideDown,
    team = team ?: this.team,
    checker = attachedCheckerData,
    retries = retries,
    resendAfter = resendAfter,
    description = description,
    enabledNotificationMethods = if (team == null) enabledNotificationMethods else listOf(),
    selectedTags = if (team == null) selectedTags else listOf(),
)
