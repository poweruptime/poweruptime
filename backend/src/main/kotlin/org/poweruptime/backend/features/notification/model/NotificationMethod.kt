package org.poweruptime.backend.features.notification.model

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
import org.poweruptime.backend.core.utils.NANO_ID_SMALL_LENGTH
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.team.model.Team
import java.time.Instant

object NotificationMethod :
    ULongIdTable(
        "notification_method",
    ),
    HasPublicId,
    HasModifiers,
    HasSoftDelete,
    HasName {
    override val publicId = nanoId("public_id", NANO_ID_SMALL_LENGTH)
    override val createdAt = createdAt()
    override val updatedAt = updatedAt()
    override val deleted = softDelete()
    override val name = name()

    val teamId = ulong("team_id").references(Team.id).index()

    val type = enumerationByCode<NotificationMethodType>("type")

    val useByDefault = bool("use_by_default").default(false)

    val titleTemplate = text("title_template").nullable()
    val bodyTemplate = text("body_template").nullable()
}

data class NotificationMethodRecord(
    val id: ULong,
    val publicId: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    val deleted: Instant?,
    val name: String,
    val teamId: ULong,
    val type: NotificationMethodType,
    val useByDefault: Boolean,
    val titleTemplate: String?,
    val bodyTemplate: String?,
)

fun NotificationMethod.rowToNotificationMethodRecord(row: ResultRow): NotificationMethodRecord =
    NotificationMethodRecord(
        id = row[id].value,
        publicId = row[publicId],
        createdAt = row[createdAt],
        updatedAt = row[updatedAt],
        deleted = row[deleted],
        name = row[name],
        teamId = row[teamId],
        type = row[type],
        useByDefault = row[useByDefault],
        titleTemplate = row[titleTemplate],
        bodyTemplate = row[bodyTemplate],
    )

data class NotificationMethodWithDataRecord(
    val notificationMethod: NotificationMethodRecord,
    val data: NotificationMethodData
)
