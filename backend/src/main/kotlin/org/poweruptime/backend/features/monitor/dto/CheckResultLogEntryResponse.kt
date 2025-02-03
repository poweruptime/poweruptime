package org.poweruptime.backend.features.monitor.dto

import org.poweruptime.backend.features.monitor.model.*
import java.time.Instant

data class CheckResultLogEntryResponse(
    val id: String,
    val stage: CheckResultLogStage,
    val level: CheckResultLogEntryLevel,
    val message: String,
    val properties: Map<String, String>?,
    val createdAt: Instant
) {
    constructor(it: CheckResultLogEntry) : this(
        id = it.id,
        stage = it.stage,
        level = it.level,
        message = it.message,
        properties = it.properties,
        createdAt = it.createdAt,
    )
}
