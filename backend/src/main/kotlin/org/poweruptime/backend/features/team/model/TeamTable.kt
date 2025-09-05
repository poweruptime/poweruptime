package org.poweruptime.backend.features.team.model

import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.ULongIdTable
import org.poweruptime.backend.core.models.HasModifiers
import org.poweruptime.backend.core.models.HasName
import org.poweruptime.backend.core.models.HasPublicId
import org.poweruptime.backend.core.models.HasSoftDelete
import org.poweruptime.backend.core.models.createdAt
import org.poweruptime.backend.core.models.name
import org.poweruptime.backend.core.models.nanoId
import org.poweruptime.backend.core.models.softDelete
import org.poweruptime.backend.core.models.updatedAt
import org.poweruptime.backend.core.utils.NANO_ID_SMALL_LENGTH
import org.poweruptime.backend.features.authentication.model.UserTable
import java.time.Instant

object TeamTable : ULongIdTable("team"), HasPublicId, HasModifiers, HasSoftDelete, HasName {
    override val publicId = nanoId("public_id", NANO_ID_SMALL_LENGTH)
    override val createdAt = createdAt()
    override val updatedAt = updatedAt()
    override val deleted = softDelete()
    override val name = name()

    val personalUserId = ulong("user_id").references(UserTable.id).nullable().uniqueIndex()
}

data class TeamRecord(
    val id: ULong,
    val publicId: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    val deleted: Instant?,
    val personalUserId: ULong?,
    val name: String,
)

fun TeamTable.rowToTeamRecord(row: ResultRow): TeamRecord =
    TeamRecord(
        id = row[id].value,
        publicId = row[publicId],
        createdAt = row[createdAt],
        updatedAt = row[updatedAt],
        deleted = row[deleted],
        personalUserId = row[personalUserId],
        name = row[name],
    )
