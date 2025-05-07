package org.poweruptime.backend.features.team.service

import jakarta.persistence.criteria.CriteriaBuilder
import jakarta.persistence.criteria.CriteriaQuery
import jakarta.persistence.criteria.Root
import org.apache.coyote.BadRequestException
import org.poweruptime.backend.core.Filter
import org.poweruptime.backend.core.FilterCompare
import org.poweruptime.backend.core.dto.PageableValidator
import org.poweruptime.backend.core.service.ASoftDeleteEntityService
import org.poweruptime.backend.core.toDeletedFilter
import org.poweruptime.backend.core.toPredicate
import org.poweruptime.backend.features.authentication.model.User
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
) : ASoftDeleteEntityService<Team>(teamRepository) {

    fun create(it: CreateTeamDto, creator: User? = null): Team {
        val team = save(Team.fromDto(it))

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
        { root: Root<Team>, _: CriteriaQuery<*>?, criteriaBuilder: CriteriaBuilder ->
            criteriaBuilder.and(
                *buildList {
                    add(deleted.toDeletedFilter())
                    userId?.let { add(Filter("teamUsers.id.user.id", it, FilterCompare.EQ)) }
                    if (userId != null && role != null) {
                        add(Filter("teamUsers.role", role, FilterCompare.EQ))
                    }
                    name?.let { add(Filter("name", it, FilterCompare.LIKE)) }
                }.toPredicate(root, criteriaBuilder).toTypedArray(),
            )
        },
        PageableValidator.validateSort(
            pageable,
            listOf("name", "personalUser.id", "createdAt"),
        ),
    )

    override fun deleteByIdOrThrow(id: String) {
        val team = getByIdOrThrow(id)
        if (team.personalUser != null) {
            throw BadRequestException("Can't delete personal team")
        }

        super.deleteByIdOrThrow(id)
    }
}
