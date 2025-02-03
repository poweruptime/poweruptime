package org.poweruptime.backend.features.user.service

import jakarta.persistence.criteria.CriteriaBuilder
import jakarta.persistence.criteria.CriteriaQuery
import jakarta.persistence.criteria.Root
import org.poweruptime.backend.core.Filter
import org.poweruptime.backend.core.FilterCompare
import org.poweruptime.backend.core.dto.PageableValidator
import org.poweruptime.backend.core.exceptions.NotFoundException
import org.poweruptime.backend.core.service.AEntityService
import org.poweruptime.backend.core.toPredicate
import org.poweruptime.backend.core.utils.RandomGenerator
import org.poweruptime.backend.features.authentication.model.SystemRole
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.mail.emails.InviteUserEmail
import org.poweruptime.backend.features.mail.service.SystemEmailService
import org.poweruptime.backend.features.team.domain.TeamUserRepository
import org.poweruptime.backend.features.team.dto.CreateTeamDto
import org.poweruptime.backend.features.team.model.TeamRole
import org.poweruptime.backend.features.team.model.TeamUser
import org.poweruptime.backend.features.team.model.TeamUserId
import org.poweruptime.backend.features.team.service.TeamService
import org.poweruptime.backend.features.user.domain.UserRepository
import org.poweruptime.backend.features.user.dto.CreateUserDto
import org.poweruptime.backend.features.user.dto.UpdateUserDto
import org.poweruptime.backend.features.user.dto.fromDto
import org.poweruptime.backend.features.user.dto.update
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service

const val PASSWORD_DEFAULT_LENGTH = 20

@Service
class UserService(
    val userRepository: UserRepository,
    val passwordEncoder: PasswordEncoder,
    val systemEmailService: SystemEmailService,
    val teamService: TeamService,
    val teamUserRepository: TeamUserRepository,
) : AEntityService<User>(userRepository) {
    fun getByEmailOrThrow(email: String): User =
        userRepository.findUserByEmail(email) ?: throw NotFoundException("""${javaClass.simpleName} not found""")

    fun getByEmail(email: String): User? = userRepository.findUserByEmail(email)

    fun minOneUserWithRoleExists(role: SystemRole) = userRepository.minOneUserWithRoleExists(role)

    fun create(dto: CreateUserDto, inviter: User? = null): User {
        val onetimePassword = dto.password ?: RandomGenerator.nanoId(PASSWORD_DEFAULT_LENGTH)

        val team = teamService.create(CreateTeamDto(dto.name))

        val user = User.fromDto(dto, passwordEncoder.encode(onetimePassword), team)

        if (dto.sendInvitation) {
            assert(inviter != null)

            systemEmailService.queueEmail(
                InviteUserEmail(invitee = user, inviter = inviter!!, onetimePassword = onetimePassword),
            )
            user.activated = true
            // force password change is automatically set to true in the User.fromDto() method
        }

        return repository.save(user).let {
            teamUserRepository.save(
                TeamUser(
                    id = TeamUserId(
                        team = team,
                        user = it,
                    ),
                    role = TeamRole.ADMIN,
                ),
            )

            it
        }
    }

    fun update(dto: UpdateUserDto, inviter: User): User {
        val isInvitationButNoPasswordProvided = dto.sendInvitation && dto.password == null

        if (isInvitationButNoPasswordProvided) {
            dto.password = RandomGenerator.nanoId(PASSWORD_DEFAULT_LENGTH)
        }

        val newPasswordHash = dto.password?.let {
            passwordEncoder.encode(it)
        }

        val user = getByIdOrThrow(dto.id).update(dto, newPasswordHash)

        if (dto.sendInvitation) {
            dto.password = dto.password ?: RandomGenerator.nanoId(PASSWORD_DEFAULT_LENGTH)

            systemEmailService.queueEmail(
                InviteUserEmail(invitee = user, inviter = inviter, onetimePassword = dto.password!!),
            )

            dto.activated = true
            dto.forcePasswordChange = true
        }

        return repository.save(user)
    }

    fun getAllPaginated(
        pageable: Pageable,
        name: String?,
        email: String?,
        activated: Boolean?,
        role: SystemRole?,
    ): Page<User> = userRepository.findAll(
        { root: Root<User>, _: CriteriaQuery<*>?, criteriaBuilder: CriteriaBuilder ->
            fun shouldAddFilter() = name != null || email != null || activated != null || role != null

            fun getFilterPredicates() = criteriaBuilder.and(
                *buildList {
                    name?.let { add(Filter("name", it, FilterCompare.LIKE)) }
                    email?.let { add(Filter("email", it, FilterCompare.LIKE)) }
                    activated?.let { add(Filter("activated", it, FilterCompare.LIKE)) }
                    role?.let { add(Filter("role", it, FilterCompare.LIKE)) }
                }.toPredicate(root, criteriaBuilder).toTypedArray(),
            )

            criteriaBuilder.and(
                *buildList {
                    if (shouldAddFilter()) {
                        add(getFilterPredicates())
                    }
                }.toTypedArray(),
            )
        },
        PageableValidator.validateSort(
            pageable,
            listOf("name", "activated", "role", "createdAt"),
        ),
    )
}
