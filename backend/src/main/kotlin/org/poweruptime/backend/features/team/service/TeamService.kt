package org.poweruptime.backend.features.team.service

import org.apache.coyote.BadRequestException
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.isNull
import org.jetbrains.exposed.v1.core.leftJoin
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.domain.Page
import org.poweruptime.backend.core.domain.deleteById
import org.poweruptime.backend.core.domain.findIdByPublicIdOrThrow
import org.poweruptime.backend.core.domain.undeleteById
import org.poweruptime.backend.core.dto.Pageable
import org.poweruptime.backend.core.utils.orThrowNotFound
import org.poweruptime.backend.features.fileUpload.File
import org.poweruptime.backend.features.fileUpload.FileService
import org.poweruptime.backend.features.monitor.domain.findIdsByTeamId
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.team.domain.findAll
import org.poweruptime.backend.features.team.dto.CreateTeamDto
import org.poweruptime.backend.features.team.dto.UpdateTeamDto
import org.poweruptime.backend.features.team.model.Team
import org.poweruptime.backend.features.team.model.TeamRecord
import org.poweruptime.backend.features.team.model.TeamRole
import org.poweruptime.backend.features.team.model.TeamUser
import org.poweruptime.backend.features.team.model.rowToTeamRecord
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class TeamService(private val fileService: FileService) {
    fun getAll(): List<TeamRecord> = Team
        .leftJoin(File, { File.id }, { Team.imageId })
        .selectAll()
        .map { Team.rowToTeamRecord(it) }

    fun getById(id: ULong) = Team
        .leftJoin(File, { File.id }, { Team.imageId })
        .selectAll()
        .where {
            Team.id eq id and Team.deleted.isNull()
        }.limit(1)
        .firstOrNull()
        ?.let {
            Team.rowToTeamRecord(it)
        }.orThrowNotFound()

    fun getByPublicId(publicId: String) = Team
        .leftJoin(File, { File.id }, { Team.imageId })
        .selectAll()
        .where {
            Team.publicId eq publicId and Team.deleted.isNull()
        }.limit(1)
        .firstOrNull()
        ?.let {
            Team.rowToTeamRecord(it)
        }.orThrowNotFound()

    fun getIdByPublicId(publicId: String, includeDeleted: Boolean = false): ULong =
        Team.findIdByPublicIdOrThrow(publicId, includeDeleted)

    @Transactional
    fun create(dto: CreateTeamDto, creatorId: ULong? = null, personalUserId: ULong? = null): TeamRecord = Team
        .insertAndGetId {
            it[Team.name] = dto.name
            it[Team.personalUserId] = personalUserId
            it[Team.imageId] = dto.imageId?.let { fileService.getIdByFileId(it) }
        }.let { getById(it.value) }
        .also { team ->
            if (creatorId != null) {
                TeamUser.insert {
                    it[TeamUser.teamId] = team.id
                    it[TeamUser.userId] = creatorId
                    it[TeamUser.role] = TeamRole.ADMIN
                }
            }
        }

    @Transactional
    fun update(dto: UpdateTeamDto): TeamRecord = Team.findIdByPublicIdOrThrow(dto.id).let { id ->
        Team
            .update({ Team.id eq id }) {
                it[Team.name] = dto.name
                it[Team.imageId] = dto.imageId?.let { fileService.getIdByFileId(it) }
            }.let { getById(id) }
    }

    fun getAllPaginated(
        pageable: Pageable,
        userId: ULong?,
        name: String?,
        role: TeamRole?,
        deleted: Boolean = false,
    ): Page<TeamRecord> = Team.findAll(
        pageable = pageable,
        userId = userId,
        name = name,
        role = role,
        deleted = deleted,
    )

    @Transactional
    fun deleteById(id: ULong): Int {
        val team = getById(id)
        if (team.personalUserId != null) {
            throw BadRequestException("Can't delete personal team")
        }

        Monitor.deleteById(Monitor.findIdsByTeamId(id))

        return Team.deleteById(id)
    }

    @Transactional
    fun undeleteById(id: ULong): TeamRecord = Team
        .undeleteById(
            id,
        ).let { getById(id) }
}
