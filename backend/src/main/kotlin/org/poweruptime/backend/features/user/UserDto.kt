package org.poweruptime.backend.features.user

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.authentication.model.SystemRole
import org.poweruptime.backend.features.authentication.model.UserRecord

data class UserMinResponse(val id: String, val email: String, val name: String) {
    constructor(user: UserRecord) : this(
        user.publicId,
        user.email,
        user.name,
    )
}

data class UserResponse(
    val id: String,
    val name: String,
    val email: String,
    val activated: Boolean,
    val forcePasswordChange: Boolean,
    val role: SystemRole,
) {
    constructor(user: UserRecord) : this(
        user.publicId,
        user.name,
        user.email,
        user.activated,
        user.forcePasswordChange,
        user.role,
    )
}

data class CreateUserDto(
    @get:NotBlank @get:Size(min = Database.MIN_NAME_LENGTH, max = Database.MAX_NAME_LENGTH) val name: String,
    @get:NotBlank @get:Email @get:Size(
        min = Database.MIN_MAIL_LENGTH,
        max = Database.MAX_MAIL_LENGTH,
    ) val email: String,
    @get:Size(min = Database.MIN_PASSWORD_LENGTH) val password: String?,
    @get:NotNull var activated: Boolean,
    @get:NotNull val sendInvitation: Boolean,
    @get:NotNull val role: SystemRole,
)

data class UpdateUserDto(
    @get:NotNull val id: String,
    @get:NotBlank @get:Size(min = Database.MIN_NAME_LENGTH, max = Database.MAX_NAME_LENGTH) val name: String,
    @get:NotBlank @get:Email @get:Size(
        min = Database.MIN_MAIL_LENGTH,
        max = Database.MAX_MAIL_LENGTH,
    ) val email: String,
    @get:NotNull val role: SystemRole,
    @get:NotNull var activated: Boolean,
    @get:NotNull var forcePasswordChange: Boolean,
    @get:NotNull val sendInvitation: Boolean,
    @get:Size(min = Database.MIN_PASSWORD_LENGTH) var password: String?,
)
