package org.poweruptime.backend.features.tag

import org.poweruptime.backend.features.team.model.Team

fun Tag.Companion.fromDto(it: TagDto, team: Team) =
    Tag(
        name = it.name,
        variant = it.variant,
        team = team,
    )
