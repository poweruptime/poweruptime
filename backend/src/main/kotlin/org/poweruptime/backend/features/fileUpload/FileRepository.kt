package org.poweruptime.backend.features.fileUpload

import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.features.statusPage.model.StatusPageTable
import java.time.Instant

fun FileTable.findUnusedCreatedAfterThan(createdAfter: Instant): List<FileRecord> =
    selectAll().where {
        (FileTable.id notInSubQuery StatusPageTable.select(StatusPageTable.imageId)) and
            (FileTable.createdAt less createdAfter)
    }
        .map { FileTable.rowToFileRecord(it) }
