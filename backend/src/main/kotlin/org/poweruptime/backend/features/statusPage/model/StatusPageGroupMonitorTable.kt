package org.poweruptime.backend.features.statusPage.model

import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.ULongIdTable
import org.poweruptime.backend.core.models.HasPosition
import org.poweruptime.backend.core.models.HasPublicId
import org.poweruptime.backend.core.models.nanoId
import org.poweruptime.backend.core.models.position
import org.poweruptime.backend.core.utils.NANO_ID_MAX_LENGTH
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.MonitorTable
import org.poweruptime.backend.features.monitor.model.rowToMonitorRecord

object StatusPageGroupMonitorTable : ULongIdTable("status_page_group_monitor"), HasPublicId, HasPosition {
    override val publicId = nanoId("public_id", NANO_ID_MAX_LENGTH)
    override val position = position()

    val statusPageId = ulong("status_page_id").references(StatusPageTable.id).index()
    val groupId = ulong("status_page_group_id").references(StatusPageGroupTable.id).index()
    val monitorId = ulong("monitor_id").references(MonitorTable.id).index()

    init {
        index(true, statusPageId, monitorId)
    }
}

data class StatusPageGroupMonitorRecord(
    val id: ULong,
    val publicId: String,
    val position: Int?,
    val statusPageId: ULong,
    val groupId: ULong,
    val monitorId: ULong,
)

data class StatusPageGroupMonitorJoinMonitorRecord(
    val groupMonitor: StatusPageGroupMonitorRecord,
    val monitor: MonitorRecord,
)

fun StatusPageGroupMonitorTable.rowToStatusPageGroupMonitorRecord(row: ResultRow): StatusPageGroupMonitorRecord =
    StatusPageGroupMonitorRecord(
        id = row[id].value,
        publicId = row[publicId],
        position = row[position],
        statusPageId = row[statusPageId],
        groupId = row[groupId],
        monitorId = row[monitorId],
    )

fun StatusPageGroupMonitorTable.rowToStatusPageGroupMonitorJoinMonitorRecord(
    row: ResultRow
): StatusPageGroupMonitorJoinMonitorRecord = StatusPageGroupMonitorJoinMonitorRecord(
    groupMonitor = StatusPageGroupMonitorTable.rowToStatusPageGroupMonitorRecord(row),
    monitor = MonitorTable.rowToMonitorRecord(row),
)
