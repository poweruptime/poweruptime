package org.poweruptime.backend.features.fileUpload

import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.ULongIdTable
import org.poweruptime.backend.core.models.HasModifiers
import org.poweruptime.backend.core.models.HasPublicId
import org.poweruptime.backend.core.models.createdAt
import org.poweruptime.backend.core.models.nanoId
import org.poweruptime.backend.core.models.updatedAt
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.NANO_ID_MAX_LENGTH
import java.time.Instant

object File : ULongIdTable("file"), HasPublicId, HasModifiers {
    override val publicId = nanoId("file_id", NANO_ID_MAX_LENGTH)
    override val createdAt = createdAt()
    override val updatedAt = updatedAt()

    val name = varchar("name", Database.MAX_FILE_NAME_LENGTH)
}

data class FileRecord(
    val id: ULong,
    val createdAt: Instant,
    val updatedAt: Instant,
    val name: String,
    val fileId: String,
)

fun File.rowToFileRecord(row: ResultRow): FileRecord =
    FileRecord(
        id = row[id].value,
        createdAt = row[createdAt],
        updatedAt = row[updatedAt],
        name = row[name],
        fileId = row[publicId],
    )
