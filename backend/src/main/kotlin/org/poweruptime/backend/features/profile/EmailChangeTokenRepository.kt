package org.poweruptime.backend.features.profile

import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.jdbc.selectAll
import java.time.Instant

fun EmailChangeTokenTable.findByUserIdAndCreatedAfter(
    userId: ULong,
    createdAfter: Instant
): List<EmailChangeTokenRecord> =
    selectAll().where {
        (EmailChangeTokenTable.userId eq userId) and (EmailChangeTokenTable.createdAt greater createdAfter)
    }.map {
        EmailChangeTokenTable.rowToEmailChangeTokenRecord(it)
    }

fun EmailChangeTokenTable.countInvalidByUserIdAndCreatedAfter(
    userId: ULong,
    createdAfter: Instant
): Long =
    selectAll().where {
        (EmailChangeTokenTable.userId eq userId) and (EmailChangeTokenTable.createdAt greater createdAfter) and
            (EmailChangeTokenTable.valid eq false)
    }.count()

fun EmailChangeTokenTable.findValidByTokenAndCreatedAfter(
    token: String,
    createdAfter: Instant
): EmailChangeTokenRecord? =
    selectAll().where {
        (EmailChangeTokenTable.publicId eq token) and
            (EmailChangeTokenTable.createdAt greater createdAfter) and
            (EmailChangeTokenTable.valid eq true)
    }.limit(1).firstOrNull()?.let {
        EmailChangeTokenTable.rowToEmailChangeTokenRecord(it)
    }

fun EmailChangeTokenTable.findByTokenAndCreatedAfter(
    token: String,
    createdAfter: Instant
): EmailChangeTokenRecord? =
    selectAll().where {
        (EmailChangeTokenTable.publicId eq token) and (EmailChangeTokenTable.createdAt greater createdAfter)
    }.limit(1).firstOrNull()?.let {
        EmailChangeTokenTable.rowToEmailChangeTokenRecord(it)
    }
