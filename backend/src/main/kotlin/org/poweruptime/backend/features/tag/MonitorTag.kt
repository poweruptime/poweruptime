package org.poweruptime.backend.features.tag

import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.Table
import org.poweruptime.backend.features.monitor.model.Monitor

object MonitorTag : Table("monitor_tag") {
    val monitorId = ulong("monitor_id").references(Monitor.id).index()
    val tagId = ulong("tag_id").references(Tag.id).index()

    override val primaryKey: PrimaryKey = PrimaryKey(monitorId, tagId)
}

data class MonitorTagRecord(
    val monitorId: ULong,
    val tagId: ULong,
)

fun MonitorTag.rowToMonitorTagRecord(row: ResultRow): MonitorTagRecord =
    MonitorTagRecord(
        monitorId = row[monitorId],
        tagId = row[tagId],
    )
