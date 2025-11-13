package org.poweruptime.backend.features.user.service

import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.domain.deleteById
import org.poweruptime.backend.core.domain.findIdByPublicIdOrThrow
import org.poweruptime.backend.core.domain.undeleteById
import org.poweruptime.backend.core.utils.RandomGenerator
import org.poweruptime.backend.core.utils.orThrowNotFound
import org.poweruptime.backend.features.authentication.model.SystemRole
import org.poweruptime.backend.features.authentication.model.UserRecord
import org.poweruptime.backend.features.authentication.model.UserTable
import org.poweruptime.backend.features.authentication.model.rowToUserRecord
import org.poweruptime.backend.features.mail.emails.InviteUserEmail
import org.poweruptime.backend.features.mail.service.SystemEmailService
import org.poweruptime.backend.features.team.dto.CreateTeamDto
import org.poweruptime.backend.features.team.service.TeamService
import org.poweruptime.backend.features.user.CreateUserDto
import org.poweruptime.backend.features.user.UpdateUserDto
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
    fun getById(id: ULong): UserRecord = UserTable
        .selectAll()
        .where { UserTable.id eq id }
        .limit(1)
        .firstOrNull()
        ?.let {
            UserTable.rowToUserRecord(it)
        }.orThrowNotFound()

    fun getByPublicId(publicId: String): UserRecord = UserTable
        .selectAll()
        .where { UserTable.publicId eq publicId }
        .limit(1)
        .firstOrNull()
        ?.let {
            UserTable.rowToUserRecord(it)
        }.orThrowNotFound()

    fun getIdByPublicId(publicId: String): ULong = UserTable.findIdByPublicIdOrThrow(publicId)

    fun getByEmail(email: String): UserRecord =
        UserTable.findByEmail(email).orThrowNotFound("""${javaClass.simpleName} not found""")

    fun findByEmail(email: String): UserRecord? = UserTable.findByEmail(email)

    fun getAll(
        pageable: Pageable,
        search: String?,
        activated: Boolean?,
        role: SystemRole?,
    ): Page<UserRecord> = UserTable.findAll(
        pageable = pageable,
        search = search,
        activated = activated,
        role = role,
    )

    fun isSetup(): Boolean = UserTable.isSetup()

    @Transactional
    fun create(dto: CreateUserDto, inviter: UserRecord? = null, forcePasswordChange: Boolean = true): UserRecord {
        val onetimePassword = dto.password ?: RandomGenerator.nanoId(PASSWORD_DEFAULT_LENGTH)

        val activated = if (dto.sendInvitation) {
            true
        } else {
            dto.activated
        }

        return UserTable.insertAndGetId {
            it[UserTable.name] = dto.name
            it[UserTable.email] = dto.email
            it[UserTable.passwordHash] = passwordEncoder.encode(onetimePassword)
            it[UserTable.activated] = activated
            it[UserTable.role] = dto.role
            it[UserTable.forcePasswordChange] = forcePasswordChange
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

            UserTable.update({ UserTable.id eq id }) {
                it[UserTable.name] = dto.name
                it[UserTable.email] = dto.email

                if (newPassword != null) {
                    it[UserTable.passwordHash] = passwordEncoder.encode(newPassword)
                }

                val activated = if (dto.sendInvitation) true else dto.activated
                val forcePasswordChange = if (dto.sendInvitation) true else dto.forcePasswordChange

                it[UserTable.activated] = activated
                it[UserTable.role] = dto.role
                it[UserTable.forcePasswordChange] = forcePasswordChange
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
        return UserTable.deleteById(id)
    }

    @Transactional
    fun undeleteById(id: ULong): UserRecord = UserTable.undeleteById(
        id,
    ).let { getById(id) }
}
