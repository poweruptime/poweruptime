package org.poweruptime.backend.features.authentication.service

import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.exceptions.UnauthorizedException
import org.poweruptime.backend.core.utils.orThrowNotFound
import org.poweruptime.backend.features.authentication.model.SystemRole
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.authentication.model.UserRecord
import org.poweruptime.backend.features.authentication.model.rowToUserRecord
import org.poweruptime.backend.features.mail.emails.PasswordChangedEmail
import org.poweruptime.backend.features.mail.service.SystemEmailService
import org.poweruptime.backend.features.user.domain.findByEmail
import org.springframework.security.core.Authentication
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import kotlin.jvm.Throws

@Service
@Transactional(readOnly = true)
class AuthService(
    private val passwordEncoder: PasswordEncoder,
    private val systemEmailService: SystemEmailService,
) {
    data class AuthDetails(val user: UserRecord) : UserDetails {
        override fun getUsername(): String = user.publicId

        override fun isAccountNonExpired(): Boolean = true

        override fun isAccountNonLocked(): Boolean = user.activated

        override fun isCredentialsNonExpired(): Boolean = !user.forcePasswordChange

        override fun isEnabled(): Boolean = user.activated

        override fun getAuthorities(): Collection<GrantedAuthority> = user.role.grantedAuthorities

        override fun getPassword(): String = user.passwordHash
    }

    @Throws(UnauthorizedException::class)
    fun getUserDetailsByPublicId(publicId: String): AuthDetails = AuthDetails(getByPublicId(publicId))

    @Transactional
    fun updateCredentials(userId: ULong, credentials: String, forcePasswordChange: Boolean? = null): UserRecord =
        User.update({ User.id eq userId }) {
            it[User.passwordHash] = passwordEncoder.encode(credentials)!!
            if (forcePasswordChange != null) {
                it[User.forcePasswordChange] = forcePasswordChange
            }
        }.let {
            User.selectAll().where { User.id eq userId }.limit(1).firstOrNull()?.let {
                User.rowToUserRecord(it)
            }.orThrowNotFound()
        }.also {
            systemEmailService.queueEmail(PasswordChangedEmail(it))
        }

    fun findByEmail(email: String): UserRecord? = User.findByEmail(email)

    @Throws(UnauthorizedException::class)
    fun getByEmail(email: String): UserRecord = findByEmail(email) ?: throw UnauthorizedException()

    @Throws(UnauthorizedException::class)
    fun getByAuth(auth: Authentication) = getByPublicId(auth.publicUserId())

    @Throws(UnauthorizedException::class)
    private fun getByPublicId(publicId: String): UserRecord = User
        .selectAll()
        .where {
            User.publicId eq publicId
        }
        .limit(1)
        .firstOrNull()
        ?.let {
            User.rowToUserRecord(it)
        } ?: throw UnauthorizedException()
}

fun Authentication.publicUserId(): String = name
fun Authentication.isAdmin(): Boolean = authorities.any { it == SystemRole.ADMIN.grantedAuthority }

// Not safe in Authentication logic
fun Authentication.user(): UserRecord = (principal as AuthService.AuthDetails).user
fun Authentication.userId(): ULong = user().id
