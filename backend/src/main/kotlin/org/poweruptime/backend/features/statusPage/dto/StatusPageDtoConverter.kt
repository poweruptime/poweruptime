package org.poweruptime.backend.features.statusPage.dto

import org.poweruptime.backend.features.fileUpload.File
import org.poweruptime.backend.features.statusPage.model.StatusPage
import org.poweruptime.backend.features.team.model.Team

fun StatusPage.Companion.fromDto(it: CreateStatusPageDto, team: Team, image: File?): StatusPage = StatusPage(
    name = it.name,
    slug = it.slug,
    team = team,
    description = it.description,
    footer = it.footer,
    image = image,
)

fun StatusPage.update(it: UpdateStatusPageDto, image: File?): StatusPage {
    name = it.name
    slug = it.slug
    description = it.description
    footer = it.footer
    this.image = image

    return this
}
