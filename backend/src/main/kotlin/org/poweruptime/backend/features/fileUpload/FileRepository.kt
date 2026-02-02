package org.poweruptime.backend.features.fileUpload

import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.less
import org.jetbrains.exposed.v1.core.notInSubQuery
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.statusPage.model.StatusPage
import org.poweruptime.backend.features.team.model.Team
import java.time.Instant

fun File.findUnusedCreatedAfterThan(createdAfter: Instant): List<FileRecord> = selectAll()
    .where {
        (id notInSubQuery StatusPage.select(StatusPage.imageId)) and
            (id notInSubQuery Team.select(Team.imageId)) and
            (id notInSubQuery User.select(User.imageId)) and
            (createdAt less createdAfter)
    }.map { rowToFileRecord(it) }
