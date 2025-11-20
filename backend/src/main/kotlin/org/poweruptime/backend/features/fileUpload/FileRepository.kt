package org.poweruptime.backend.features.fileUpload

import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.less
import org.jetbrains.exposed.v1.core.notInSubQuery
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.features.statusPage.model.StatusPage
import java.time.Instant

fun File.findUnusedCreatedAfterThan(createdAfter: Instant): List<FileRecord> =
    selectAll().where {
        (id notInSubQuery StatusPage.select(StatusPage.imageId)) and
            (createdAt less createdAfter)
    }
        .map { rowToFileRecord(it) }
