package org.poweruptime.backend.features.authentication

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.poweruptime.backend.features.authentication.model.Session
import java.time.Instant

data class LoginDto(
    @get:NotBlank val email: String,
    @get:NotBlank @Size(min = 6) var password: String,
    @get:Size(min = 6, max = 60) val sessionInformation: String? = null,
    val stayLoggedIn: Boolean? = null,
)

data class LoginWithPasswordChangeDto(
    @get:NotBlank var email: String,
    @get:NotBlank @Size(min = 6) var newPassword: String,
    @get:NotBlank @Size(min = 6) var oldPassword: String,
    @get:Size(min = 6, max = 60) var sessionInformation: String? = null,
    var stayLoggedIn: Boolean? = null
)

data class PasswordForgotRequestDto(
    @get:NotBlank var email: String,
)

data class PasswordForgotResetDto(
    @get:NotBlank var email: String,
    @get:NotBlank var resetToken: String,
    @get:NotBlank @Size(min = 6) var newPassword: String,
)

data class RefreshJwtWithSessionTokenDto(
    @get:NotBlank var refreshToken: String,
    @get:NotBlank @get:Size(min = 6, max = 60) var sessionInformation: String
)

data class LogoutDto(
    @get:NotBlank var refreshToken: String
)

data class JwtResponse(
    var accessToken: String,
    var refreshToken: String? = null
)

data class SessionResponse(
    val id: String,
    val description: String,
    val userId: String,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    constructor(session: Session) : this(
        session.id,
        session.description,
        session.user.id,
        session.createdAt,
        session.updatedAt,
    )
}
