package org.poweruptime.backend.features.user.service

import me.dafnik.JpaSpecificationBuilder.buildSpecification
import org.poweruptime.backend.core.dto.validateSort
import org.poweruptime.backend.core.service.AEntityService
import org.poweruptime.backend.core.utils.RandomGenerator
import org.poweruptime.backend.core.utils.orThrowNotFound
import org.poweruptime.backend.features.authentication.model.SystemRole
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.mail.emails.InviteUserEmail
import org.poweruptime.backend.features.mail.service.SystemEmailService
import org.poweruptime.backend.features.team.dto.CreateTeamDto
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
) : AEntityService<User>(userRepository) {
    fun getByEmailOrThrow(email: String): User =
        userRepository.findUserByEmail(email).orThrowNotFound("""${javaClass.simpleName} not found""")

    fun getByEmail(email: String): User? = userRepository.findUserByEmail(email)

    fun create(dto: CreateUserDto, inviter: User? = null, forcePasswordChange: Boolean = true): User {
        val onetimePassword = dto.password ?: RandomGenerator.nanoId(PASSWORD_DEFAULT_LENGTH)

        val user = User.fromDto(
            createDto = dto,
            passwordHash = passwordEncoder.encode(onetimePassword),
            forcePasswordChange = forcePasswordChange,
        )

        if (dto.sendInvitation) {
            systemEmailService.queueEmail(
                InviteUserEmail(invitee = user, inviter = inviter, onetimePassword = onetimePassword),
            )
            user.activated = true
            // force password change is automatically set to true in the User.fromDto() method
        }

        return repository.save(user).let {
            teamService.create(dto = CreateTeamDto(dto.name), creator = it, personalUser = it)

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
        search: String?,
        activated: Boolean?,
        role: SystemRole?,
    ): Page<User> = userRepository.findAll(
        buildSpecification {
            where {
                and {
                    search?.let {
                        or {
                            col(User::name) lowercaseLike "%$it%"
                            col(User::email) lowercaseLike "%$it%"
                        }
                    }

                    activated?.let { col(User::activated) eq it }
                    role?.let { col(User::role) eq it }
                }
            }
        },
        pageable.validateSort("name", "activated", "role", "createdAt"),
    )

    fun isSetup(): Boolean = userRepository.isSetup()
}
