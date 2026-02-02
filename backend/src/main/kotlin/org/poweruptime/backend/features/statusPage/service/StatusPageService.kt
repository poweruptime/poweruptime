package org.poweruptime.backend.features.statusPage.service

import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.leftJoin
import org.jetbrains.exposed.v1.jdbc.batchInsert
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.domain.Page
import org.poweruptime.backend.core.domain.findIdByPublicIdOrThrow
import org.poweruptime.backend.core.domain.includeDeleted
import org.poweruptime.backend.core.dto.Pageable
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.core.utils.orThrowNotFound
import org.poweruptime.backend.features.fileUpload.File
import org.poweruptime.backend.features.fileUpload.FileService
import org.poweruptime.backend.features.monitor.service.MonitorService
import org.poweruptime.backend.features.monitor.service.ensureAllMonitorsInTeam
import org.poweruptime.backend.features.statusPage.domain.findAll
import org.poweruptime.backend.features.statusPage.domain.findByDomainName
import org.poweruptime.backend.features.statusPage.dto.CreateStatusPageDto
import org.poweruptime.backend.features.statusPage.dto.UpdateStatusPageDto
import org.poweruptime.backend.features.statusPage.model.StatusPage
import org.poweruptime.backend.features.statusPage.model.StatusPageDomainName
import org.poweruptime.backend.features.statusPage.model.StatusPageGroup
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupMonitor
import org.poweruptime.backend.features.statusPage.model.StatusPageRecord
import org.poweruptime.backend.features.statusPage.model.rowToStatusPageDomainNameRecord
import org.poweruptime.backend.features.statusPage.model.rowToStatusPageGroupRecord
import org.poweruptime.backend.features.statusPage.model.rowToStatusPageRecord
import org.poweruptime.backend.features.team.service.TeamService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
@Transactional(readOnly = true)
class StatusPageService(
    private val monitorService: MonitorService,
    private val teamService: TeamService,
    private val fileService: FileService,
) {
    fun getIdByPublicId(publicId: String, includeDeleted: Boolean = false): ULong =
        StatusPage.findIdByPublicIdOrThrow(publicId, includeDeleted)

    fun getById(id: ULong, includeDeleted: Boolean = false): StatusPageRecord = StatusPage
        .leftJoin(File, { File.id }, { StatusPage.imageId })
        .selectAll()
        .where { StatusPage.id eq id and StatusPage.deleted.includeDeleted(includeDeleted) }
        .limit(1)
        .firstOrNull()
        ?.let {
            StatusPage.rowToStatusPageRecord(it)
        }.orThrowNotFound()

    fun findBySlug(slug: String, includeDeleted: Boolean = false): StatusPageRecord? = StatusPage
        .leftJoin(File, { File.id }, { StatusPage.imageId })
        .selectAll()
        .where { StatusPage.publicId eq slug and StatusPage.deleted.includeDeleted(includeDeleted) }
        .limit(1)
        .firstOrNull()
        ?.let {
            StatusPage.rowToStatusPageRecord(it)
        }

    fun findByDomainName(domainName: String): StatusPageRecord? = StatusPage.findByDomainName(domainName)

    fun getAllPaginated(
        pageable: Pageable,
        teamId: ULong,
        name: String?,
        deleted: Boolean = false,
    ): Page<StatusPageRecord> = StatusPage.findAll(
        pageable = pageable,
        teamId = teamId,
        name = name,
        deleted = deleted,
    )

    @Transactional
    fun create(dto: CreateStatusPageDto): StatusPageRecord {
        val allMonitorIds = dto.groups.flatMap { it.monitorIds }

        // Check for unique monitor
        if (allMonitorIds.toSet().size != allMonitorIds.size) {
            throw BadRequestException("All monitor ids should be unique")
        }

        if (findBySlug(dto.slug) != null) {
            throw BadRequestException("Slug ${dto.slug} already used", "slug_in_use")
        }

        val teamId = teamService.getIdByPublicId(dto.teamId)

        val monitors = monitorService.getByPublicId(allMonitorIds).associateBy { it.publicId }

        if (!monitors.values.ensureAllMonitorsInTeam(teamId)) {
            throw BadRequestException("All monitors should be in the same team as of status page")
        }

        val statusPage = StatusPage
            .insertAndGetId {
                it[StatusPage.name] = dto.name
                it[StatusPage.publicId] = dto.slug
                it[StatusPage.description] = dto.description
                it[StatusPage.footer] = dto.footer
                it[StatusPage.teamId] = teamId
                it[StatusPage.imageId] = dto.imageId?.let { fileService.getIdByFileId(it) }
            }.let { getById(it.value) }

        StatusPageDomainName
            .batchInsert(dto.domainNames) { domainName ->
                this[StatusPageDomainName.name] = domainName
                this[StatusPageDomainName.statusPageId] = statusPage.id
            }.map { StatusPageDomainName.rowToStatusPageDomainNameRecord(it) }

        val groups = StatusPageGroup
            .batchInsert(
                dto.groups.mapIndexed { index, dto -> Pair(index, dto) },
            ) { (index, dto) ->
                this[StatusPageGroup.position] = index
                this[StatusPageGroup.statusPageId] = statusPage.id
                this[StatusPageGroup.name] = dto.name
                this[StatusPageGroup.description] = dto.description
            }.map { StatusPageGroup.rowToStatusPageGroupRecord(it) }

        dto.groups.forEachIndexed { groupIndex, groupDto ->
            StatusPageGroupMonitor.batchInsert(
                groupDto.monitorIds.mapIndexed { index, monitorId -> Pair(index, monitorId) },
            ) { (index, monitorId) ->
                this[StatusPageGroupMonitor.position] = index
                this[StatusPageGroupMonitor.statusPageId] = statusPage.id
                this[StatusPageGroupMonitor.groupId] = groups[groupIndex].id
                this[StatusPageGroupMonitor.monitorId] = monitors[monitorId].orThrowNotFound().id
            }
        }

        return statusPage
    }

    @Transactional
    fun update(dto: UpdateStatusPageDto): StatusPageRecord {
        val allMonitorIds = dto.groups.flatMap { it.monitorIds }

        // Check for unique monitor
        if (allMonitorIds.toSet().size != allMonitorIds.size) {
            throw BadRequestException("All monitor ids should be unique")
        }

        val oldStatusPage = findBySlug(dto.slug).orThrowNotFound()

        if (oldStatusPage.publicId != dto.slug) {
            if (findBySlug(dto.slug) != null) {
                throw BadRequestException("Slug ${dto.slug} already used", "slug_in_use")
            }
        }

        val monitors = monitorService.getByPublicId(allMonitorIds).associateBy { it.publicId }

        if (!monitors.values.ensureAllMonitorsInTeam(oldStatusPage.teamId)) {
            throw BadRequestException("All monitors should be in the same team as the status page")
        }

        val statusPage = StatusPage
            .update({ StatusPage.id eq oldStatusPage.id }) {
                it[StatusPage.name] = dto.name
                it[StatusPage.publicId] = dto.slug
                it[StatusPage.description] = dto.description
                it[StatusPage.footer] = dto.footer
                it[StatusPage.imageId] = dto.imageId?.let { fileService.getIdByFileId(it) }
            }.let { getById(oldStatusPage.id) }

        StatusPageDomainName.deleteWhere { StatusPageDomainName.statusPageId eq oldStatusPage.id }
        StatusPageGroupMonitor.deleteWhere { StatusPageGroupMonitor.statusPageId eq oldStatusPage.id }
        StatusPageGroup.deleteWhere { StatusPageGroup.statusPageId eq oldStatusPage.id }

        StatusPageDomainName
            .batchInsert(dto.domainNames) { domainName ->
                this[StatusPageDomainName.name] = domainName
                this[StatusPageDomainName.statusPageId] = statusPage.id
            }.map { StatusPageDomainName.rowToStatusPageDomainNameRecord(it) }

        val groups = StatusPageGroup
            .batchInsert(
                dto.groups.mapIndexed { index, dto -> Pair(index, dto) },
            ) { (index, dto) ->
                this[StatusPageGroup.position] = index
                this[StatusPageGroup.statusPageId] = statusPage.id
                this[StatusPageGroup.name] = dto.name
                this[StatusPageGroup.description] = dto.description
            }.map { StatusPageGroup.rowToStatusPageGroupRecord(it) }

        dto.groups.forEachIndexed { groupIndex, groupDto ->
            StatusPageGroupMonitor.batchInsert(
                groupDto.monitorIds.mapIndexed { index, monitorId -> Pair(index, monitorId) },
            ) { (index, monitorId) ->
                this[StatusPageGroupMonitor.position] = index
                this[StatusPageGroupMonitor.statusPageId] = statusPage.id
                this[StatusPageGroupMonitor.groupId] = groups[groupIndex].id
                this[StatusPageGroupMonitor.monitorId] = monitors[monitorId].orThrowNotFound().id
            }
        }

        return statusPage
    }

    @Transactional
    fun deleteById(id: ULong) {
        val statusPage = getById(id)
        StatusPage.update({ StatusPage.id eq id }) {
            it[deleted] = Instant.now()
            it[publicId] = statusPage.publicId + DELETED_SLUG_SUFFIX
        }
    }

    @Transactional
    fun undeleteById(id: ULong): StatusPageRecord {
        val statusPage = getById(id, includeDeleted = true)
        StatusPage.update({ StatusPage.id eq id }) {
            it[deleted] = null
            it[publicId] = statusPage.publicId.removeSuffix(DELETED_SLUG_SUFFIX)
        }
        return statusPage.apply {
            publicId = publicId.removeSuffix(DELETED_SLUG_SUFFIX)
            deleted = null
        }
    }
}

private const val DELETED_SLUG_SUFFIX = "_deleted_111"
