package org.poweruptime.backend.features.profile

import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.ULongIdTable
import org.poweruptime.backend.core.models.HasModifiers
import org.poweruptime.backend.core.models.HasPublicId
import org.poweruptime.backend.core.models.createdAt
import org.poweruptime.backend.core.models.nanoId
import org.poweruptime.backend.core.models.updatedAt
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.NANO_ID_MAX_LENGTH
import org.poweruptime.backend.features.authentication.model.User
import java.time.Instant

object EmailChangeToken : ULongIdTable("email_change_token"), HasPublicId, HasModifiers {
    override val publicId = nanoId("token", NANO_ID_MAX_LENGTH)
    override val createdAt = createdAt()
    override val updatedAt = updatedAt()

    val userId = ulong("user_id").references(User.id).index()

    val email = varchar("email", Database.MAX_MAIL_LENGTH)
    val oldEmail = varchar("old_email", Database.MAX_MAIL_LENGTH)

    val valid = bool("valid").clientDefault { true }
}

data class EmailChangeTokenRecord(
    val id: ULong,
    val publicId: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    val userId: ULong,
    val email: String,
    val oldEmail: String,
)

fun EmailChangeToken.rowToEmailChangeTokenRecord(row: ResultRow): EmailChangeTokenRecord =
    EmailChangeTokenRecord(
        id = row[id].value,
        publicId = row[publicId],
        createdAt = row[createdAt],
        updatedAt = row[updatedAt],
        userId = row[userId],
        email = row[email],
        oldEmail = row[oldEmail],
    )
