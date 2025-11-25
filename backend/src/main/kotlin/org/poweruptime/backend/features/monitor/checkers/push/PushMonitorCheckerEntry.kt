package org.poweruptime.backend.features.monitor.checkers.push

import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.ULongIdTable
import org.poweruptime.backend.core.models.HasModifiers
import org.poweruptime.backend.core.models.HasPublicId
import org.poweruptime.backend.core.models.createdAt
import org.poweruptime.backend.core.models.enumerationByCode
import org.poweruptime.backend.core.models.updatedAt
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import java.time.Instant

object PushMonitorCheckerEntry : ULongIdTable("monitor_push_entry"), HasPublicId, HasModifiers {
    override val publicId = varchar("push_id", Database.MAX_PUSH_ID_LENGTH)
    override val createdAt = createdAt()
    override val updatedAt = updatedAt()

    val status = enumerationByCode<MonitorStatus>("status").clientDefault { MonitorStatus.PENDING }

    val title = varchar("title", Database.MAX_TITLE_LENGTH)
    val message = varchar("message", Database.MAX_MESSAGE_LENGTH).nullable()
    val pingMs = long("ping").nullable()
}

fun PushMonitorCheckerEntry.rowToPushMonitorCheckerEntryRecord(row: ResultRow): PushMonitorCheckerEntryRecord =
    PushMonitorCheckerEntryRecord(
        id = row[id].value,
        pushId = row[publicId],
        createdAt = row[createdAt],
        updatedAt = row[updatedAt],
        status = row[status],
        title = row[title],
        message = row[message],
        pingMs = row[pingMs],
    )

data class PushMonitorCheckerEntryRecord(
    val id: ULong,
    val pushId: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    val status: MonitorStatus,
    val title: String,
    val message: String?,
    val pingMs: Long?,
)
