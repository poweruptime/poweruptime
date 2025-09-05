package org.poweruptime.backend.features.authentication.model

import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.ULongIdTable
import org.poweruptime.backend.core.models.HasModifiers
import org.poweruptime.backend.core.models.createdAt
import org.poweruptime.backend.core.models.updatedAt
import org.poweruptime.backend.core.utils.Database
import java.time.Instant

object MFABackupCodeTable : ULongIdTable("mfa_backup_code"), HasModifiers {
    override val createdAt = createdAt()
    override val updatedAt = updatedAt()

    val mfaId = ulong("mfa_id").references(MFATable.id).index()

    val codeHash = varchar("code_hash", Database.MAX_BCRYPT_LENGTH)

    val valid = bool("valid")

    init {
        index(isUnique = true, mfaId, codeHash)
    }
}

data class MFABackupCodeRecord(
    val id: ULong,
    val createdAt: Instant,
    val updatedAt: Instant,
    val mfaId: ULong,
    val codeHash: String,
    val valid: Boolean,
)

fun MFABackupCodeTable.rowToMFABackupCodeRecord(row: ResultRow): MFABackupCodeRecord =
    MFABackupCodeRecord(
        id = row[id].value,
        createdAt = row[createdAt],
        updatedAt = row[updatedAt],
        mfaId = row[mfaId],
        codeHash = row[codeHash],
        valid = row[valid],
    )
