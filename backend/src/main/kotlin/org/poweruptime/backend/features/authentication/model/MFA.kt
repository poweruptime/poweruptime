package org.poweruptime.backend.features.authentication.model

import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.ULongIdTable
import org.poweruptime.backend.core.models.HasModifiers
import org.poweruptime.backend.core.models.createdAt
import org.poweruptime.backend.core.models.updatedAt
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.RandomGenerator
import java.time.Instant

object MFA : ULongIdTable("mfa"), HasModifiers {
    override val createdAt = createdAt()
    override val updatedAt = updatedAt()

    val secret = varchar("secret", Database.MAX_MFA_SECRET_LENGTH).clientDefault {
        RandomGenerator.nanoId(Database.MAX_MFA_SECRET_LENGTH)
    }

    val active = bool("active").clientDefault { false }
}

data class MFARecord(
    val id: ULong,
    val createdAt: Instant,
    val updatedAt: Instant,
    val secret: String,
    val active: Boolean,
)

fun MFA.rowToMFARecord(row: ResultRow): MFARecord = MFARecord(
    id = row[id].value,
    createdAt = row[createdAt],
    updatedAt = row[updatedAt],
    secret = row[secret],
    active = row[active],
)
