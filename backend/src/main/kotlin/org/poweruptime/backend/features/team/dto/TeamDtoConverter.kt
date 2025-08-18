package org.poweruptime.backend.features.team.dto

import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.team.model.Team

fun Team.Companion.fromDto(it: CreateTeamDto, personalUser: User? = null): Team = Team(
    name = it.name,
    personalUser = personalUser,
)

fun Team.update(it: UpdateTeamDto): Team {
    name = it.name

    return this
}
