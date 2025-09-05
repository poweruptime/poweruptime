package org.poweruptime.backend.features.monitor.model

import org.jetbrains.exposed.v1.core.QueryAlias
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.ULongIdTable
import org.jetbrains.exposed.v1.javatime.timestamp
import org.poweruptime.backend.core.models.HasModifiers
import org.poweruptime.backend.core.models.HasPublicId
import org.poweruptime.backend.core.models.createdAt
import org.poweruptime.backend.core.models.enumerationByCode
import org.poweruptime.backend.core.models.nanoId
import org.poweruptime.backend.core.models.updatedAt
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.NANO_ID_MAX_LENGTH
import org.poweruptime.backend.features.team.model.TeamRecord
import java.time.Instant

object CheckResultTable : ULongIdTable("check_result"), HasPublicId, HasModifiers {
    override val publicId = nanoId("public_id", NANO_ID_MAX_LENGTH)
    override val createdAt = createdAt()
    override val updatedAt = updatedAt()

    val monitorId = ulong("monitor_id").references(MonitorTable.id).index()

    val status = enumerationByCode<MonitorStatus>("status")
        .clientDefault { MonitorStatus.PENDING }

    val timesRetried = long("times_retried").nullable()

    val previousStatus = enumerationByCode<MonitorStatus>("previous_status").nullable()

    val pickedUpAt = timestamp("picked_up_at").nullable()
    val checkedAt = timestamp("checked_at").nullable()

    val pingMs = long("ping").nullable()
    val title = varchar("title", Database.MAX_TITLE_LENGTH).nullable()
    val message = varchar("message", Database.MAX_MESSAGE_LENGTH).nullable()
}

data class CheckResultRecord(
    val id: ULong,
    val publicId: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    val monitorId: ULong,
    var status: MonitorStatus,
    var timesRetried: Long?,
    var previousStatus: MonitorStatus?,
    var pickedUpAt: Instant?,
    var checkedAt: Instant?,
    var pingMs: Long?,
    var title: String?,
    var message: String?,
)

fun CheckResultTable.rowToCheckResultRecord(row: ResultRow): CheckResultRecord =
    CheckResultRecord(
        id = row[id].value,
        publicId = row[publicId],
        createdAt = row[createdAt],
        updatedAt = row[updatedAt],
        monitorId = row[monitorId],
        status = row[status],
        timesRetried = row[timesRetried],
        previousStatus = row[previousStatus],
        pickedUpAt = row[pickedUpAt],
        checkedAt = row[checkedAt],
        pingMs = row[pingMs],
        title = row[title],
        message = row[message],
    )

fun CheckResultTable.rowToCheckResultRecord(row: ResultRow, alias: QueryAlias): CheckResultRecord =
    CheckResultRecord(
        id = row[alias[id]].value,
        publicId = row[alias[publicId]],
        createdAt = row[alias[createdAt]],
        updatedAt = row[alias[updatedAt]],
        monitorId = row[alias[monitorId]],
        status = row[alias[status]],
        timesRetried = row[alias[timesRetried]],
        previousStatus = row[alias[previousStatus]],
        pickedUpAt = row[alias[pickedUpAt]],
        checkedAt = row[alias[checkedAt]],
        pingMs = row[alias[pingMs]],
        title = row[alias[title]],
        message = row[alias[message]],
    )

open class CheckResultJoinMonitorRecord(open val checkResult: CheckResultRecord, open val monitor: MonitorRecord)

data class CheckResultJoinMonitorAndTeamRecord(
    override val checkResult: CheckResultRecord,
    override val monitor: MonitorRecord,
    val team: TeamRecord
) : CheckResultJoinMonitorRecord(checkResult, monitor)
