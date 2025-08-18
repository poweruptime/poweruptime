package org.poweruptime.backend.features.team.service

import me.dafnik.JpaSpecificationBuilder.buildSpecification
import org.apache.coyote.BadRequestException
import org.poweruptime.backend.core.colDeleted
import org.poweruptime.backend.core.dto.validateSort
import org.poweruptime.backend.core.service.ASoftDeleteEntityService
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.monitor.service.MonitorService
import org.poweruptime.backend.features.team.domain.TeamRepository
import org.poweruptime.backend.features.team.domain.TeamUserRepository
import org.poweruptime.backend.features.team.dto.CreateTeamDto
import org.poweruptime.backend.features.team.dto.UpdateTeamDto
import org.poweruptime.backend.features.team.dto.fromDto
import org.poweruptime.backend.features.team.dto.update
import org.poweruptime.backend.features.team.model.Team
import org.poweruptime.backend.features.team.model.TeamRole
import org.poweruptime.backend.features.team.model.TeamUser
import org.poweruptime.backend.features.team.model.TeamUserId
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service

@Service
class TeamService(
    private val teamRepository: TeamRepository,
    private val teamUserRepository: TeamUserRepository,
    private val monitorService: MonitorService,
) : ASoftDeleteEntityService<Team>(teamRepository) {

    fun create(dto: CreateTeamDto, creator: User? = null, personalUser: User? = null): Team {
        val team = save(Team.fromDto(dto, personalUser))

        if (creator != null) {
            teamUserRepository.save(
                TeamUser(
                    id = TeamUserId(
                        team = team,
                        user = creator,
                    ),
                    role = TeamRole.ADMIN,
                ),
            )
        }

        return team
    }

    fun update(it: UpdateTeamDto) = save(getByIdOrThrow(it.id).update(it))

    fun getAllPaginated(
        pageable: Pageable,
        userId: String?,
        name: String?,
        role: TeamRole?,
        deleted: Boolean = false,
    ): Page<Team> = teamRepository.findAll(
        buildSpecification {
            where {
                and {
                    colDeleted(deleted)

                    userId?.let { col("teamUsers.id.user.id") eq it }

                    if (userId != null && role != null) {
                        col("teamUsers.role") eq role
                    }

                    name?.let { col(Team::name) lowercaseLike "%$it%" }
                }

                fetch<User>("personalUser")
            }
        },
        pageable.validateSort("name", "personalUser.id", "createdAt"),
    )

    override fun deleteByIdOrThrow(id: String) {
        val team = getByIdOrThrow(id)
        if (team.personalUser != null) {
            throw BadRequestException("Can't delete personal team")
        }

        monitorService.getIdsByTeamId(id).forEach { monitorService.deleteByIdOrThrow(it) }

        super.deleteByIdOrThrow(id)
    }
}
