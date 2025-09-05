package org.poweruptime.backend.features.tag

import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.Table
import org.poweruptime.backend.features.monitor.model.MonitorTable

object MonitorTagTable : Table("monitor_tag") {
    val monitorId = ulong("monitor_id").references(MonitorTable.id).index()
    val tagId = ulong("tag_id").references(TagTable.id).index()

    override val primaryKey: PrimaryKey = PrimaryKey(monitorId, tagId)
}

data class MonitorTagRecord(
    val monitorId: ULong,
    val tagId: ULong,
)

fun MonitorTagTable.rowToMonitorTagRecord(row: ResultRow): MonitorTagRecord =
    MonitorTagRecord(
        monitorId = row[monitorId],
        tagId = row[tagId],
    )
