package org.poweruptime.backend.features.statusPage.model

import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.ULongIdTable
import org.poweruptime.backend.core.models.HasModifiers
import org.poweruptime.backend.core.models.HasPosition
import org.poweruptime.backend.core.models.HasPublicId
import org.poweruptime.backend.core.models.createdAt
import org.poweruptime.backend.core.models.name
import org.poweruptime.backend.core.models.nanoId
import org.poweruptime.backend.core.models.position
import org.poweruptime.backend.core.models.updatedAt
import org.poweruptime.backend.core.utils.NANO_ID_DEFAULT_LENGTH
import java.time.Instant

object StatusPageGroupTable : ULongIdTable("status_page_group"), HasPublicId, HasModifiers, HasPosition {
    override val publicId = nanoId("public_id", NANO_ID_DEFAULT_LENGTH)
    override val createdAt = createdAt()
    override val updatedAt = updatedAt()
    override val position = position()

    val statusPageId = ulong("status_page_id").references(StatusPageTable.id).index()

    val name = name().nullable()
    val description = text("description").nullable()
}

data class StatusPageGroupRecord(
    val id: ULong,
    val publicId: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    val name: String?,
    val position: Int?,
    val statusPageId: ULong,
    val description: String?,
)

fun StatusPageGroupTable.rowToStatusPageGroupRecord(row: ResultRow): StatusPageGroupRecord =
    StatusPageGroupRecord(
        id = row[id].value,
        publicId = row[publicId],
        createdAt = row[createdAt],
        updatedAt = row[updatedAt],
        name = row[name],
        position = row[position],
        statusPageId = row[statusPageId],
        description = row[description],
    )
