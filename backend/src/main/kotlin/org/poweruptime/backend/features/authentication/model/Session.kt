package org.poweruptime.backend.features.authentication.model

import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.ULongIdTable
import org.poweruptime.backend.core.models.HasModifiers
import org.poweruptime.backend.core.models.HasPublicId
import org.poweruptime.backend.core.models.createdAt
import org.poweruptime.backend.core.models.nanoId
import org.poweruptime.backend.core.models.updatedAt
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.NANO_ID_DEFAULT_LENGTH
import java.time.Instant

object Session : ULongIdTable("session"), HasPublicId, HasModifiers {
    override val publicId = nanoId("public_id", NANO_ID_DEFAULT_LENGTH)
    override val createdAt = createdAt()
    override val updatedAt = updatedAt()

    val userId = ulong("user_id").references(User.id).index()

    val description = varchar("description", Database.MAX_SESSION_DESCRIPTION_LENGTH)
    val valid = bool("valid").clientDefault { true }
}

data class SessionRecord(
    val id: ULong,
    val publicId: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    val userId: ULong,
    val description: String,
    val valid: Boolean,
)

data class SessionJoinUserRecord(val session: SessionRecord, val user: UserRecord)

fun Session.rowToSessionRecord(row: ResultRow): SessionRecord = SessionRecord(
    id = row[id].value,
    publicId = row[publicId],
    createdAt = row[createdAt],
    updatedAt = row[updatedAt],
    userId = row[userId],
    description = row[description],
    valid = row[valid],
)

object RefreshToken : ULongIdTable("refresh_token"), HasModifiers {
    override val createdAt = createdAt()
    override val updatedAt = updatedAt()

    val sessionId = ulong("session_id").references(Session.id).index()

    val token = varchar("token", Database.MAX_REFRESH_TOKEN_LENGTH)
    val valid = bool("valid").clientDefault { true }
}

data class RefreshTokenRecord(
    val id: ULong,
    val createdAt: Instant,
    val updatedAt: Instant,
    val sessionId: ULong,
    val token: String,
    val valid: Boolean,
)

fun RefreshToken.rowToRefreshTokenRecord(row: ResultRow): RefreshTokenRecord = RefreshTokenRecord(
    id = row[id].value,
    createdAt = row[createdAt],
    updatedAt = row[updatedAt],
    sessionId = row[sessionId],
    token = row[token],
    valid = row[valid],
)
