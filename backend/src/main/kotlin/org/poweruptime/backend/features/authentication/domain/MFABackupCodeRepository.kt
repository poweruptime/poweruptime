package org.poweruptime.backend.features.authentication.domain

import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.features.authentication.model.MFABackupCodeRecord
import org.poweruptime.backend.features.authentication.model.MFABackupCodeTable
import org.poweruptime.backend.features.authentication.model.rowToMFABackupCodeRecord

fun MFABackupCodeTable.findByMFAId(mfaId: ULong): List<MFABackupCodeRecord> = selectAll().where {
    MFABackupCodeTable.mfaId eq mfaId
}.map {
    MFABackupCodeTable.rowToMFABackupCodeRecord(it)
}

fun MFABackupCodeTable.invalidateCodeById(id: ULong) = update({ MFABackupCodeTable.id eq id }) {
    it[MFABackupCodeTable.valid] = false
}
