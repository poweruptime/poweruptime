package org.poweruptime.backend.features.authentication.service

import org.poweruptime.backend.core.exceptions.UnauthorizedException
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.mail.emails.PasswordChangedEmail
import org.poweruptime.backend.features.mail.service.SystemEmailService
import org.poweruptime.backend.features.user.domain.UserRepository
import org.springframework.security.core.Authentication
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import kotlin.jvm.Throws

@Service
class AuthService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val systemEmailService: SystemEmailService,
) {
    data class AuthDetails(private val user: User) : UserDetails {
        override fun getUsername(): String = user.id

        override fun isAccountNonExpired(): Boolean = true

        override fun isAccountNonLocked(): Boolean = user.activated

        override fun isCredentialsNonExpired(): Boolean = !user.forcePasswordChange

        override fun isEnabled(): Boolean = user.activated

        override fun getAuthorities(): Collection<GrantedAuthority> = user.role.grantedAuthorities

        override fun getPassword(): String = user.passwordHash
    }

    @Throws(UnauthorizedException::class)
    fun getUserDetailsById(id: String) =
        AuthDetails(userRepository.findUserById(id) ?: throw UnauthorizedException())

    fun updateCredentials(entity: User, credentials: String): User =
        userRepository.save(
            entity.apply {
                passwordHash = passwordEncoder.encode(credentials)
            },
        ).let {
            systemEmailService.queueEmail(PasswordChangedEmail(it))
            it
        }

    fun getByEmail(email: String): User? = userRepository.findUserByEmail(email)

    @Throws(UnauthorizedException::class)
    fun getByEmailOrThrow(email: String) = getByEmail(email) ?: throw UnauthorizedException()

    @Throws(UnauthorizedException::class)
    fun getByIdOrThrow(id: String) = userRepository.findUserById(id) ?: throw UnauthorizedException()

    @Throws(UnauthorizedException::class)
    fun getByAuthOrThrow(auth: Authentication) = getByIdOrThrow(auth.name)
}
