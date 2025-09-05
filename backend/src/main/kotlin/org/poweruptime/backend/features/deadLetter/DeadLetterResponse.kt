package org.poweruptime.backend.features.deadLetter

import java.time.Instant

data class DeadLetterResponse(
    val id: String,
    val body: String,
    val queue: String,
    val exchange: String,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    constructor(it: DeadLetterRecord) : this(
        it.publicId,
        it.body,
        it.queue,
        it.exchange,
        it.createdAt,
        it.updatedAt,
    )
}
