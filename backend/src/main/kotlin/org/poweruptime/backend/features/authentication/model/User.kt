package org.poweruptime.backend.features.authentication.model

import org.jetbrains.exposed.v1.core.Alias
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
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.NANO_ID_SMALL_LENGTH
import java.time.Instant

object User : ULongIdTable(""""user""""), HasPublicId, HasModifiers, HasSoftDelete, HasName {
    override val publicId = nanoId("public_id", NANO_ID_SMALL_LENGTH)
    override val createdAt = createdAt()
    override val updatedAt = updatedAt()
    override val deleted = softDelete()
    override val name = name()

    val email = varchar("email", Database.MAX_MAIL_LENGTH).uniqueIndex()
    val passwordHash = varchar("password_hash", Database.MAX_BCRYPT_LENGTH)

    val mfaId = ulong("mfa_id").references(MFA.id).nullable()

    val activated = bool("activated")
    val forcePasswordChange = bool("force_password_change")
    val role = enumerationByCode<SystemRole>("role")
}

data class UserRecord(
    val id: ULong,
    val publicId: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    val name: String,
    val email: String,
    val passwordHash: String,
    val mfaId: ULong?,
    val activated: Boolean,
    val forcePasswordChange: Boolean,
    val role: SystemRole,
)

fun User.rowToUserRecord(row: ResultRow): UserRecord = UserRecord(
    id = row[id].value,
    publicId = row[publicId],
    createdAt = row[createdAt],
    updatedAt = row[updatedAt],
    name = row[name],
    email = row[email],
    passwordHash = row[passwordHash],
    mfaId = row[mfaId],
    activated = row[activated],
    forcePasswordChange = row[forcePasswordChange],
    role = row[role],
)

fun User.rowToUserRecord(row: ResultRow, alias: Alias<User>): UserRecord = UserRecord(
    id = row[alias[id]].value,
    publicId = row[alias[publicId]],
    createdAt = row[alias[createdAt]],
    updatedAt = row[alias[updatedAt]],
    name = row[alias[name]],
    email = row[alias[email]],
    passwordHash = row[alias[passwordHash]],
    mfaId = row[alias[mfaId]],
    activated = row[alias[activated]],
    forcePasswordChange = row[alias[forcePasswordChange]],
    role = row[alias[role]],
)
