package org.poweruptime.backend.features.profile

import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greater
import org.jetbrains.exposed.v1.jdbc.selectAll
import java.time.Instant

fun EmailChangeToken.findByUserIdAndCreatedAfter(
    userId: ULong,
    createdAfter: Instant
): List<EmailChangeTokenRecord> =
    selectAll().where {
        (EmailChangeToken.userId eq userId) and (EmailChangeToken.createdAt greater createdAfter)
    }.map {
        EmailChangeToken.rowToEmailChangeTokenRecord(it)
    }

fun EmailChangeToken.countInvalidByUserIdAndCreatedAfter(
    userId: ULong,
    createdAfter: Instant
): Long =
    selectAll().where {
        (EmailChangeToken.userId eq userId) and (EmailChangeToken.createdAt greater createdAfter) and
            (EmailChangeToken.valid eq false)
    }.count()

fun EmailChangeToken.findValidByTokenAndCreatedAfter(
    token: String,
    createdAfter: Instant
): EmailChangeTokenRecord? =
    selectAll().where {
        (EmailChangeToken.publicId eq token) and
            (EmailChangeToken.createdAt greater createdAfter) and
            (EmailChangeToken.valid eq true)
    }.limit(1).firstOrNull()?.let {
        EmailChangeToken.rowToEmailChangeTokenRecord(it)
    }

fun EmailChangeToken.findByTokenAndCreatedAfter(
    token: String,
    createdAfter: Instant
): EmailChangeTokenRecord? =
    selectAll().where {
        (EmailChangeToken.publicId eq token) and (EmailChangeToken.createdAt greater createdAfter)
    }.limit(1).firstOrNull()?.let {
        EmailChangeToken.rowToEmailChangeTokenRecord(it)
    }
