package org.poweruptime.backend.features.team.service

import org.apache.coyote.BadRequestException
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.domain.deleteById
import org.poweruptime.backend.core.domain.findByIdOrThrow
import org.poweruptime.backend.core.domain.findByPublicIdOrThrow
import org.poweruptime.backend.core.domain.findIdByPublicIdOrThrow
import org.poweruptime.backend.core.domain.undeleteById
import org.poweruptime.backend.features.monitor.domain.findIdsByTeamId
import org.poweruptime.backend.features.monitor.model.MonitorTable
import org.poweruptime.backend.features.team.domain.findAll
import org.poweruptime.backend.features.team.dto.CreateTeamDto
import org.poweruptime.backend.features.team.dto.UpdateTeamDto
import org.poweruptime.backend.features.team.model.TeamRecord
import org.poweruptime.backend.features.team.model.TeamRole
import org.poweruptime.backend.features.team.model.TeamTable
import org.poweruptime.backend.features.team.model.TeamUserTable
import org.poweruptime.backend.features.team.model.rowToTeamRecord
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class TeamService {
    fun getAll(): List<TeamRecord> = TeamTable.selectAll().map { TeamTable.rowToTeamRecord(it) }

    fun getById(id: ULong) = TeamTable.findByIdOrThrow(id) {
        TeamTable.rowToTeamRecord(it)
    }

    fun getByPublicId(publicId: String) = TeamTable.findByPublicIdOrThrow(publicId) {
        TeamTable.rowToTeamRecord(it)
    }

    fun getIdByPublicId(publicId: String, includeDeleted: Boolean = false): ULong =
        TeamTable.findIdByPublicIdOrThrow(publicId, includeDeleted)

    @Transactional
    fun create(dto: CreateTeamDto, creatorId: ULong? = null, personalUserId: ULong? = null): TeamRecord =
        TeamTable.insertAndGetId {
            it[TeamTable.name] = dto.name
            it[TeamTable.personalUserId] = personalUserId
        }
            .let { getById(it.value) }
            .also { team ->
                if (creatorId != null) {
                    TeamUserTable.insert {
                        it[TeamUserTable.teamId] = team.id
                        it[TeamUserTable.userId] = creatorId
                        it[TeamUserTable.role] = TeamRole.ADMIN
                    }
                }
            }

    @Transactional
    fun update(dto: UpdateTeamDto): TeamRecord =
        TeamTable.findIdByPublicIdOrThrow(dto.id).let { id ->
            TeamTable.update({ TeamTable.id eq id }) {
                it[TeamTable.name] = dto.name
            }.let { getById(id) }
        }

    fun getAllPaginated(
        pageable: Pageable,
        userId: ULong?,
        name: String?,
        role: TeamRole?,
        deleted: Boolean = false,
    ): Page<TeamRecord> = TeamTable.findAll(
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

        MonitorTable.deleteById(MonitorTable.findIdsByTeamId(id))

        return TeamTable.deleteById(id)
    }

    @Transactional
    fun undeleteById(id: ULong): TeamRecord = TeamTable.undeleteById(
        id,
    ).let { getById(id) }
}
