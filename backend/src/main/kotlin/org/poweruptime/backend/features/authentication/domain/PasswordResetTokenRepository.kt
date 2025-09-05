package org.poweruptime.backend.features.authentication.domain

import org.jetbrains.exposed.v1.core.SqlExpressionBuilder.less
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.features.authentication.model.PasswordResetTokenTable
import java.time.Instant

fun PasswordResetTokenTable.deleteOlderThan(before: Instant): Int = PasswordResetTokenTable.deleteWhere {
    PasswordResetTokenTable.createdAt less before
}

fun PasswordResetTokenTable.countByUserIdAndCreatedAfter(
    userId: ULong,
    createdAfter: Instant
): Long = PasswordResetTokenTable.selectAll().where {
    (PasswordResetTokenTable.userId eq userId) and (PasswordResetTokenTable.createdAt greater createdAfter)
}.count()

fun PasswordResetTokenTable.invalidateByUserIdTokenAndCreatedAfter(
    userId: ULong,
    token: String,
    createdAfter: Instant
): Int = PasswordResetTokenTable.update({
    (PasswordResetTokenTable.userId eq userId) and
        (PasswordResetTokenTable.createdAt greater createdAfter) and
        (PasswordResetTokenTable.id eq token) and
        (PasswordResetTokenTable.valid eq true)
}) {
    it[PasswordResetTokenTable.valid] = false
}
