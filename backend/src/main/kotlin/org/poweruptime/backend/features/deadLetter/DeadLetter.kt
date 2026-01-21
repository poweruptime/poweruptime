package org.poweruptime.backend.features.deadLetter

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

object DeadLetter : ULongIdTable("dead_letter"), HasPublicId, HasModifiers {
    override val publicId = nanoId("public_id", NANO_ID_DEFAULT_LENGTH)
    override val createdAt = createdAt()
    override val updatedAt = updatedAt()

    val queue = varchar("queue", Database.MAX_QUEUE_LENGTH)
    val exchange = varchar("exchange", Database.MAX_EXCHANGE_LENGTH)
    val body = text("body")
}

data class DeadLetterRecord(
    val id: ULong,
    val publicId: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    val queue: String,
    val exchange: String,
    val body: String,
)

fun DeadLetter.rowToDeadLetterRecord(row: ResultRow): DeadLetterRecord = DeadLetterRecord(
    id = row[id].value,
    publicId = row[publicId],
    createdAt = row[createdAt],
    updatedAt = row[updatedAt],
    queue = row[queue],
    exchange = row[exchange],
    body = row[body],
)
