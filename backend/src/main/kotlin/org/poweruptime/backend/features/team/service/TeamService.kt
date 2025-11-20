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
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.team.domain.findAll
import org.poweruptime.backend.features.team.dto.CreateTeamDto
import org.poweruptime.backend.features.team.dto.UpdateTeamDto
import org.poweruptime.backend.features.team.model.Team
import org.poweruptime.backend.features.team.model.TeamRecord
import org.poweruptime.backend.features.team.model.TeamRole
import org.poweruptime.backend.features.team.model.TeamUser
import org.poweruptime.backend.features.team.model.rowToTeamRecord
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class TeamService {
    fun getAll(): List<TeamRecord> = Team.selectAll().map { Team.rowToTeamRecord(it) }

    fun getById(id: ULong) = Team.findByIdOrThrow(id) {
        Team.rowToTeamRecord(it)
    }

    fun getByPublicId(publicId: String) = Team.findByPublicIdOrThrow(publicId) {
        Team.rowToTeamRecord(it)
    }

    fun getIdByPublicId(publicId: String, includeDeleted: Boolean = false): ULong =
        Team.findIdByPublicIdOrThrow(publicId, includeDeleted)

    @Transactional
    fun create(dto: CreateTeamDto, creatorId: ULong? = null, personalUserId: ULong? = null): TeamRecord =
        Team.insertAndGetId {
            it[Team.name] = dto.name
            it[Team.personalUserId] = personalUserId
        }
            .let { getById(it.value) }
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
    fun update(dto: UpdateTeamDto): TeamRecord =
        Team.findIdByPublicIdOrThrow(dto.id).let { id ->
            Team.update({ Team.id eq id }) {
                it[Team.name] = dto.name
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
    fun undeleteById(id: ULong): TeamRecord = Team.undeleteById(
        id,
    ).let { getById(id) }
}
