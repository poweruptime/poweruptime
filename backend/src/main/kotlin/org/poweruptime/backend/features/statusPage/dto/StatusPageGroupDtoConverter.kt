package org.poweruptime.backend.features.statusPage.dto

import org.poweruptime.backend.features.statusPage.model.StatusPage
import org.poweruptime.backend.features.statusPage.model.StatusPageGroup

fun StatusPageGroup.Companion.fromDto(
    it: StatusPageGroupDto,
    position: Int,
    statusPage: StatusPage
): StatusPageGroup = StatusPageGroup(
    statusPage = statusPage,
    name = it.name,
    description = it.description,
    position = position,
)
