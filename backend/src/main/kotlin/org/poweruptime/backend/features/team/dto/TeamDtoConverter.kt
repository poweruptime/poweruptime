package org.poweruptime.backend.features.team.dto

import org.poweruptime.backend.features.team.model.Team

fun Team.Companion.fromDto(it: CreateTeamDto): Team = Team(
    name = it.name,
)

fun Team.update(it: UpdateTeamDto): Team {
    name = it.name

    return this
}
