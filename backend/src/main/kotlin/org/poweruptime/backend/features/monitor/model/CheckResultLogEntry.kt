package org.poweruptime.backend.features.monitor.model

import kotlinx.serialization.json.Json
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.ULongIdTable
import org.jetbrains.exposed.v1.json.json
import org.poweruptime.backend.core.models.HasModifiers
import org.poweruptime.backend.core.models.HasPublicId
import org.poweruptime.backend.core.models.createdAt
import org.poweruptime.backend.core.models.enumerationByCode
import org.poweruptime.backend.core.models.nanoId
import org.poweruptime.backend.core.models.updatedAt
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.NANO_ID_MAX_LENGTH
import java.time.Instant

object CheckResultLogEntry : ULongIdTable("check_result_log_entry"), HasModifiers, HasPublicId {
    override val publicId = nanoId("public_id", NANO_ID_MAX_LENGTH)
    override val createdAt = createdAt()
    override val updatedAt = updatedAt()

    val checkResultId = ulong("check_result_id").references(CheckResult.id).index()

    val stage = enumerationByCode<CheckResultLogStage>("stage")
    val level = enumerationByCode<CheckResultLogEntryLevel>("level")

    val message = varchar("message", Database.MAX_MESSAGE_LENGTH)
    val properties = json<Map<String, String>>("properties", Json.Default).nullable()
}

data class CheckResultLogEntryRecord(
    val id: ULong,
    val publicId: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    val checkResultId: ULong,
    val stage: CheckResultLogStage,
    val level: CheckResultLogEntryLevel,
    val message: String,
    val properties: Map<String, String>?,
)

fun CheckResultLogEntry.rowToCheckResultLogEntry(row: ResultRow): CheckResultLogEntryRecord = CheckResultLogEntryRecord(
    id = row[id].value,
    publicId = row[publicId],
    createdAt = row[createdAt],
    updatedAt = row[updatedAt],
    checkResultId = row[checkResultId],
    stage = row[stage],
    level = row[level],
    message = row[message],
    properties = row[properties],
)
