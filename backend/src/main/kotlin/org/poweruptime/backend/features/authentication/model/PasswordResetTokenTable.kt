package org.poweruptime.backend.features.authentication.model

import org.jetbrains.exposed.v1.core.ResultRow
import org.poweruptime.backend.core.models.HasModifiers
import org.poweruptime.backend.core.models.NanoIdTable
import org.poweruptime.backend.core.models.createdAt
import org.poweruptime.backend.core.models.updatedAt
import org.poweruptime.backend.core.utils.NANO_ID_MAX_LENGTH
import java.time.Instant

object PasswordResetTokenTable : NanoIdTable("password_reset_token", NANO_ID_MAX_LENGTH), HasModifiers {
    override val createdAt = createdAt()
    override val updatedAt = updatedAt()

    val userId = ulong("user_id").references(UserTable.id).index()
    val valid = bool("valid").clientDefault { true }
}

data class PasswordResetTokenRecord(
    val id: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    val userId: ULong,
    val valid: Boolean,
)

fun PasswordResetTokenTable.rowToPasswordResetTokenRecord(row: ResultRow): PasswordResetTokenRecord =
    PasswordResetTokenRecord(
        id = row[id].value,
        createdAt = row[createdAt],
        updatedAt = row[updatedAt],
        userId = row[userId],
        valid = row[valid],
    )
