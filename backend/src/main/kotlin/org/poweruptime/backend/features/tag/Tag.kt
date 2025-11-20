package org.poweruptime.backend.features.tag

import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.ULongIdTable
import org.poweruptime.backend.core.models.HasModifiers
import org.poweruptime.backend.core.models.HasName
import org.poweruptime.backend.core.models.HasPublicId
import org.poweruptime.backend.core.models.HasSoftDelete
import org.poweruptime.backend.core.models.createdAt
import org.poweruptime.backend.core.models.enumerationByCode
import org.poweruptime.backend.core.models.name
import org.poweruptime.backend.core.models.nanoId
import org.poweruptime.backend.core.models.softDelete
import org.poweruptime.backend.core.models.updatedAt
import org.poweruptime.backend.core.utils.NANO_ID_DEFAULT_LENGTH
import org.poweruptime.backend.features.team.model.Team
import java.time.Instant

object Tag : ULongIdTable("tag"), HasPublicId, HasModifiers, HasSoftDelete, HasName {
    override val publicId = nanoId("public_id", NANO_ID_DEFAULT_LENGTH)
    override val createdAt = createdAt()
    override val updatedAt = updatedAt()
    override val deleted = softDelete()
    override val name = name()

    val teamId = ulong("team_id").references(Team.id).index()

    val variant = enumerationByCode<TagVariant>("variant")

    init {
        index(true, teamId, name)
    }
}

data class TagRecord(
    val id: ULong,
    val publicId: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    val deleted: Instant?,
    val teamId: ULong,
    val name: String,
    var variant: TagVariant,
)

data class TagJoinMonitorRecord(
    val tag: TagRecord,
    val monitorTag: MonitorTagRecord
)

fun Tag.rowToTagRecord(row: ResultRow): TagRecord =
    TagRecord(
        id = row[id].value,
        publicId = row[publicId],
        createdAt = row[createdAt],
        updatedAt = row[updatedAt],
        deleted = row[deleted],
        teamId = row[teamId],
        name = row[name],
        variant = row[variant],
    )
