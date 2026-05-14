package org.poweruptime.backend.features.authentication

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.authentication.model.SessionRecord
import java.time.Instant

data class OAuthLoginDto(
    @get:NotBlank val code: String,
)

data class LoginDto(
    @get:NotBlank val email: String,
    @get:NotBlank @Size(min = Database.MIN_PASSWORD_LENGTH) val password: String,
    @get:Size(min = 6, max = 60) val sessionInformation: String? = null,
    val stayLoggedIn: Boolean? = null,
)

data class LoginWithPasswordChangeDto(
    @get:NotBlank val email: String,
    @get:NotBlank @Size(min = Database.MIN_PASSWORD_LENGTH) val newPassword: String,
    @get:NotBlank @Size(min = Database.MIN_PASSWORD_LENGTH) val oldPassword: String,
    @get:Size(min = 6, max = 60) val sessionInformation: String? = null,
    val stayLoggedIn: Boolean? = null,
)

data class SetupDto(
    @get:NotBlank @get:Size(min = Database.MIN_NAME_LENGTH, max = Database.MAX_NAME_LENGTH) val name: String,
    @get:NotBlank @get:Email @get:Size(
        min = Database.MIN_MAIL_LENGTH,
        max = Database.MAX_MAIL_LENGTH,
    ) val email: String,
)

data class PasswordForgotRequestDto(@get:NotBlank val email: String)

data class PasswordForgotResetDto(
    @get:NotBlank val email: String,
    @get:NotBlank val resetToken: String,
    @get:NotBlank @Size(min = Database.MIN_PASSWORD_LENGTH) val newPassword: String,
)

data class RefreshJwtWithSessionTokenDto(
    @get:NotBlank val refreshToken: String,
    @get:NotBlank @get:Size(min = 6, max = 60) val sessionInformation: String,
)

data class LogoutDto(@get:NotBlank val refreshToken: String)

data class JwtResponse(val accessToken: String, val refreshToken: String? = null)

data class SessionResponse(val id: String, val description: String, val createdAt: Instant, val updatedAt: Instant) {
    constructor(session: SessionRecord) : this(
        session.publicId,
        session.description,
        session.createdAt,
        session.updatedAt,
    )
}
