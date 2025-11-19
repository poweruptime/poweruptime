package org.poweruptime.backend.features.authentication.domain

import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.features.authentication.model.MFABackupCode
import org.poweruptime.backend.features.authentication.model.MFABackupCodeRecord
import org.poweruptime.backend.features.authentication.model.rowToMFABackupCodeRecord

fun MFABackupCode.findByMFAId(mfaId: ULong): List<MFABackupCodeRecord> = selectAll().where {
    MFABackupCode.mfaId eq mfaId
}.map {
    MFABackupCode.rowToMFABackupCodeRecord(it)
}

fun MFABackupCode.invalidateCodeById(id: ULong) = update({ MFABackupCode.id eq id }) {
    it[MFABackupCode.valid] = false
}
