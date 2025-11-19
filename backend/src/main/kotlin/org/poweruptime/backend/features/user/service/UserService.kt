package org.poweruptime.backend.features.user.service

import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.domain.deleteById
import org.poweruptime.backend.core.domain.findIdByPublicIdOrThrow
import org.poweruptime.backend.core.domain.undeleteById
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.core.utils.RandomGenerator
import org.poweruptime.backend.core.utils.orThrowNotFound
import org.poweruptime.backend.features.authentication.model.SystemRole
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.authentication.model.UserRecord
import org.poweruptime.backend.features.authentication.model.rowToUserRecord
import org.poweruptime.backend.features.mail.emails.InviteUserEmail
import org.poweruptime.backend.features.mail.service.SystemEmailService
import org.poweruptime.backend.features.team.dto.CreateTeamDto
import org.poweruptime.backend.features.team.service.TeamService
import org.poweruptime.backend.features.user.CreateUserDto
import org.poweruptime.backend.features.user.UpdateUserDto
import org.poweruptime.backend.features.user.domain.existsByEmail
import org.poweruptime.backend.features.user.domain.findAll
import org.poweruptime.backend.features.user.domain.findByEmail
import org.poweruptime.backend.features.user.domain.isSetup
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

const val PASSWORD_DEFAULT_LENGTH = 20

@Service
@Transactional(readOnly = true)
class UserService(
    val passwordEncoder: PasswordEncoder,
    val systemEmailService: SystemEmailService,
    val teamService: TeamService,
) {
    fun getById(id: ULong): UserRecord = User
        .selectAll()
        .where { User.id eq id }
        .limit(1)
        .firstOrNull()
        ?.let {
            User.rowToUserRecord(it)
        }.orThrowNotFound()

    fun getByPublicId(publicId: String): UserRecord = User
        .selectAll()
        .where { User.publicId eq publicId }
        .limit(1)
        .firstOrNull()
        ?.let {
            User.rowToUserRecord(it)
        }.orThrowNotFound()

    fun getIdByPublicId(publicId: String): ULong = User.findIdByPublicIdOrThrow(publicId)

    fun getByEmail(email: String): UserRecord =
        User.findByEmail(email).orThrowNotFound("""${javaClass.simpleName} not found""")

    fun findByEmail(email: String): UserRecord? = User.findByEmail(email)

    fun getAll(
        pageable: Pageable,
        search: String?,
        activated: Boolean?,
        role: SystemRole?,
    ): Page<UserRecord> = User.findAll(
        pageable = pageable,
        search = search,
        activated = activated,
        role = role,
    )

    fun isSetup(): Boolean = User.isSetup()

    @Transactional
    fun create(dto: CreateUserDto, inviter: UserRecord? = null, forcePasswordChange: Boolean = true): UserRecord {
        if (User.existsByEmail(dto.email)) {
            throw BadRequestException("User email already taken", "USER_EMAIL_ALREADY_TAKEN")
        }

        val onetimePassword = dto.password ?: RandomGenerator.nanoId(PASSWORD_DEFAULT_LENGTH)

        val activated = if (dto.sendInvitation) {
            true
        } else {
            dto.activated
        }

        return User.insertAndGetId {
            it[User.name] = dto.name
            it[User.email] = dto.email
            it[User.passwordHash] = passwordEncoder.encode(onetimePassword)
            it[User.activated] = activated
            it[User.role] = dto.role
            it[User.forcePasswordChange] = forcePasswordChange
        }
            .let { getById(it.value) }
            .also { user ->
                teamService.create(dto = CreateTeamDto(dto.name), creatorId = user.id, personalUserId = user.id)

                if (dto.sendInvitation) {
                    systemEmailService.queueEmail(
                        InviteUserEmail(invitee = user, inviter = inviter, onetimePassword = onetimePassword),
                    )
                }
            }
    }

    @Transactional
    fun update(dto: UpdateUserDto, inviter: UserRecord): UserRecord =
        getIdByPublicId(dto.id).let { id ->
            val isInvitationButNoPasswordProvided = dto.sendInvitation && dto.password == null

            val newPassword = if (isInvitationButNoPasswordProvided) {
                RandomGenerator.nanoId(PASSWORD_DEFAULT_LENGTH)
            } else {
                dto.password
            }

            User.update({ User.id eq id }) {
                it[User.name] = dto.name
                it[User.email] = dto.email

                if (newPassword != null) {
                    it[User.passwordHash] = passwordEncoder.encode(newPassword)
                }

                val activated = if (dto.sendInvitation) true else dto.activated
                val forcePasswordChange = if (dto.sendInvitation) true else dto.forcePasswordChange

                it[User.activated] = activated
                it[User.role] = dto.role
                it[User.forcePasswordChange] = forcePasswordChange
            }.let {
                getById(id)
            }.also { user ->
                if (dto.sendInvitation) {
                    require(newPassword != null)

                    systemEmailService.queueEmail(
                        InviteUserEmail(invitee = user, inviter = inviter, onetimePassword = newPassword),
                    )
                }
            }
        }

    @Transactional
    fun deleteById(id: ULong): Int {
        return User.deleteById(id)
    }

    @Transactional
    fun undeleteById(id: ULong): UserRecord = User.undeleteById(
        id,
    ).let { getById(id) }
}
