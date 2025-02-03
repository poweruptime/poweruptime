package org.poweruptime.backend.features.user.dto

import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.team.model.Team

fun User.Companion.fromDto(createDto: CreateUserDto, passwordHash: String, personalTeam: Team) =
    User(
        name = createDto.name,
        email = createDto.email,
        passwordHash = passwordHash,
        activated = createDto.activated,
        role = createDto.role,
        forcePasswordChange = true,
        personalTeam = personalTeam,
    )

fun User.update(dto: UpdateUserDto, newPasswordHash: String? = null): User {
    name = dto.name
    email = dto.email
    activated = dto.activated
    role = dto.role
    forcePasswordChange = dto.forcePasswordChange

    newPasswordHash?.let {
        passwordHash = newPasswordHash
    }

    return this
}
