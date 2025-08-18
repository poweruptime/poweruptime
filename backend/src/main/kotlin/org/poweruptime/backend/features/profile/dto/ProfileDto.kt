package org.poweruptime.backend.features.profile.dto

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.poweruptime.backend.features.authentication.model.SystemRole
import org.poweruptime.backend.features.authentication.model.User

data class UpdatePasswordDto(
    @get:NotBlank @get:Size(min = 6) val newPassword: String,
    @get:NotBlank val oldPassword: String,
)

data class UpdateEmailDto(
    @get:NotBlank @get:Size(min = 6) val password: String,
    @get:NotBlank @get:Email @get:Size(min = 6, max = 255) val email: String,
)

data class ConfirmMFADto(
    val code: String
)

data class ConfirmMFAResponse(
    val backupCodes: List<String>
)

data class SetupMFAResponse(
    val base32Secret: String
)

enum class MFAState {
    DISABLED,
    ENABLED,
}

data class ProfileResponse(
    val id: String,
    val email: String,
    val name: String,
    val role: SystemRole,
) {
    constructor(user: User) : this(
        id = user.id,
        email = user.email,
        name = user.name,
        role = user.role,
    )
}
