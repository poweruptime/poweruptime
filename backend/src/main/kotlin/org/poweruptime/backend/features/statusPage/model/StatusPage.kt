package org.poweruptime.backend.features.statusPage.model

import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.ULongIdTable
import org.poweruptime.backend.core.models.HasModifiers
import org.poweruptime.backend.core.models.HasName
import org.poweruptime.backend.core.models.HasPublicId
import org.poweruptime.backend.core.models.HasSoftDelete
import org.poweruptime.backend.core.models.createdAt
import org.poweruptime.backend.core.models.name
import org.poweruptime.backend.core.models.softDelete
import org.poweruptime.backend.core.models.updatedAt
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.fileUpload.File
import org.poweruptime.backend.features.fileUpload.FileRecord
import org.poweruptime.backend.features.fileUpload.rowToFileRecord
import org.poweruptime.backend.features.team.model.Team
import java.time.Instant

object StatusPage : ULongIdTable("status_page"), HasPublicId, HasModifiers, HasSoftDelete, HasName {
    override val publicId = varchar("slug", Database.MAX_SLUG_LENGTH).uniqueIndex()
    override val createdAt = createdAt()
    override val updatedAt = updatedAt()
    override val deleted = softDelete()
    override val name = name()

    val teamId = ulong("team_id").references(Team.id).index()
    val imageId = ulong("image_id").references(File.id).nullable()

    val description = text("description").nullable()
    val footer = text("footer").nullable()
}

data class StatusPageRecord(
    val id: ULong,
    var publicId: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    var deleted: Instant?,
    val name: String,
    val teamId: ULong,
    val imageId: ULong?,
    val image: FileRecord?,
    val description: String?,
    val footer: String?,
)

fun StatusPage.rowToStatusPageRecord(row: ResultRow): StatusPageRecord =
    StatusPageRecord(
        id = row[id].value,
        publicId = row[publicId],
        createdAt = row[createdAt],
        updatedAt = row[updatedAt],
        deleted = row[deleted],
        name = row[name],
        teamId = row[teamId],
        imageId = row[imageId],
        image = if (row[imageId] != null) File.rowToFileRecord(row) else null,
        description = row[description],
        footer = row[footer],
    )
