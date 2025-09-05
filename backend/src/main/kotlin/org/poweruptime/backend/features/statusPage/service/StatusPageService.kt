package org.poweruptime.backend.features.statusPage.service

import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.leftJoin
import org.jetbrains.exposed.v1.core.statements.UpsertSqlExpressionBuilder.eq
import org.jetbrains.exposed.v1.jdbc.batchInsert
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.domain.findIdByPublicIdOrThrow
import org.poweruptime.backend.core.domain.includeDeleted
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.core.utils.orThrowNotFound
import org.poweruptime.backend.features.fileUpload.FileService
import org.poweruptime.backend.features.fileUpload.FileTable
import org.poweruptime.backend.features.monitor.service.MonitorService
import org.poweruptime.backend.features.monitor.service.ensureAllMonitorsInTeam
import org.poweruptime.backend.features.statusPage.domain.findAll
import org.poweruptime.backend.features.statusPage.domain.findByDomainName
import org.poweruptime.backend.features.statusPage.dto.CreateStatusPageDto
import org.poweruptime.backend.features.statusPage.dto.UpdateStatusPageDto
import org.poweruptime.backend.features.statusPage.model.StatusPageDomainNameTable
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupMonitorTable
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupTable
import org.poweruptime.backend.features.statusPage.model.StatusPageRecord
import org.poweruptime.backend.features.statusPage.model.StatusPageTable
import org.poweruptime.backend.features.statusPage.model.rowToStatusPageDomainNameRecord
import org.poweruptime.backend.features.statusPage.model.rowToStatusPageGroupRecord
import org.poweruptime.backend.features.statusPage.model.rowToStatusPageRecord
import org.poweruptime.backend.features.team.service.TeamService
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
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
        StatusPageTable.findIdByPublicIdOrThrow(publicId, includeDeleted)

    fun getById(id: ULong, includeDeleted: Boolean = false): StatusPageRecord =
        StatusPageTable
            .leftJoin(FileTable, { FileTable.id }, { StatusPageTable.imageId })
            .selectAll()
            .where { StatusPageTable.id eq id and StatusPageTable.deleted.includeDeleted(includeDeleted) }
            .limit(1)
            .firstOrNull()
            ?.let {
                StatusPageTable.rowToStatusPageRecord(it)
            }.orThrowNotFound()

    fun findBySlug(slug: String, includeDeleted: Boolean = false): StatusPageRecord? =
        StatusPageTable
            .leftJoin(FileTable, { FileTable.id }, { StatusPageTable.imageId })
            .selectAll()
            .where { StatusPageTable.publicId eq slug and StatusPageTable.deleted.includeDeleted(includeDeleted) }
            .limit(1)
            .firstOrNull()
            ?.let {
                StatusPageTable.rowToStatusPageRecord(it)
            }

    fun findByDomainName(domainName: String): StatusPageRecord? = StatusPageTable.findByDomainName(domainName)

    fun getAllPaginated(
        pageable: Pageable,
        teamId: ULong,
        name: String?,
        deleted: Boolean = false
    ): Page<StatusPageRecord> = StatusPageTable.findAll(
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

        val fileId = dto.imageId?.let { fileService.getIdByFileId(it) }

        val statusPage = StatusPageTable.insertAndGetId {
            it[StatusPageTable.name] = dto.name
            it[StatusPageTable.publicId] = dto.slug
            it[StatusPageTable.description] = dto.description
            it[StatusPageTable.footer] = dto.footer
            it[StatusPageTable.teamId] = teamId
            it[StatusPageTable.imageId] = fileId
        }.let { getById(it.value) }

        StatusPageDomainNameTable.batchInsert(dto.domainNames) { domainName ->
            this[StatusPageDomainNameTable.name] = domainName
            this[StatusPageDomainNameTable.statusPageId] = statusPage.id
        }.map { StatusPageDomainNameTable.rowToStatusPageDomainNameRecord(it) }

        val groups = StatusPageGroupTable.batchInsert(
            dto.groups.mapIndexed { index, dto -> Pair(index, dto) },
        ) { (index, dto) ->
            this[StatusPageGroupTable.position] = index
            this[StatusPageGroupTable.statusPageId] = statusPage.id
            this[StatusPageGroupTable.name] = dto.name
            this[StatusPageGroupTable.description] = dto.description
        }.map { StatusPageGroupTable.rowToStatusPageGroupRecord(it) }

        dto.groups.forEachIndexed { groupIndex, groupDto ->
            StatusPageGroupMonitorTable.batchInsert(
                groupDto.monitorIds.mapIndexed { index, monitorId -> Pair(index, monitorId) },
            ) { (index, monitorId) ->
                this[StatusPageGroupMonitorTable.position] = index
                this[StatusPageGroupMonitorTable.statusPageId] = statusPage.id
                this[StatusPageGroupMonitorTable.groupId] = groups[groupIndex].id
                this[StatusPageGroupMonitorTable.monitorId] = monitors[monitorId].orThrowNotFound().id
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

        val fileId = dto.imageId?.let { fileService.getIdByFileId(it) }

        val statusPage = StatusPageTable.update({ StatusPageTable.id eq oldStatusPage.id }) {
            it[StatusPageTable.name] = dto.name
            it[StatusPageTable.publicId] = dto.slug
            it[StatusPageTable.description] = dto.description
            it[StatusPageTable.footer] = dto.footer
            it[StatusPageTable.imageId] = fileId
        }.let { getById(oldStatusPage.id) }

        StatusPageDomainNameTable.deleteWhere { StatusPageDomainNameTable.statusPageId eq oldStatusPage.id }
        StatusPageGroupMonitorTable.deleteWhere { StatusPageGroupMonitorTable.statusPageId eq oldStatusPage.id }
        StatusPageGroupTable.deleteWhere { StatusPageGroupTable.statusPageId eq oldStatusPage.id }

        StatusPageDomainNameTable.batchInsert(dto.domainNames) { domainName ->
            this[StatusPageDomainNameTable.name] = domainName
            this[StatusPageDomainNameTable.statusPageId] = statusPage.id
        }.map { StatusPageDomainNameTable.rowToStatusPageDomainNameRecord(it) }

        val groups = StatusPageGroupTable.batchInsert(
            dto.groups.mapIndexed { index, dto -> Pair(index, dto) },
        ) { (index, dto) ->
            this[StatusPageGroupTable.position] = index
            this[StatusPageGroupTable.statusPageId] = statusPage.id
            this[StatusPageGroupTable.name] = dto.name
            this[StatusPageGroupTable.description] = dto.description
        }.map { StatusPageGroupTable.rowToStatusPageGroupRecord(it) }

        dto.groups.forEachIndexed { groupIndex, groupDto ->
            StatusPageGroupMonitorTable.batchInsert(
                groupDto.monitorIds.mapIndexed { index, monitorId -> Pair(index, monitorId) },
            ) { (index, monitorId) ->
                this[StatusPageGroupMonitorTable.position] = index
                this[StatusPageGroupMonitorTable.statusPageId] = statusPage.id
                this[StatusPageGroupMonitorTable.groupId] = groups[groupIndex].id
                this[StatusPageGroupMonitorTable.monitorId] = monitors[monitorId].orThrowNotFound().id
            }
        }

        return statusPage
    }

    @Transactional
    fun deleteById(id: ULong) {
        val statusPage = getById(id)
        StatusPageTable.update({ StatusPageTable.id eq id }) {
            it[deleted] = Instant.now()
            it[publicId] = statusPage.publicId + DELETED_SLUG_SUFFIX
        }
    }

    @Transactional
    fun undeleteById(id: ULong): StatusPageRecord {
        val statusPage = getById(id, includeDeleted = true)
        StatusPageTable.update({ StatusPageTable.id eq id }) {
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
