package org.poweruptime.backend.features.monitor.model

import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.ULongIdTable
import org.jetbrains.exposed.v1.javatime.timestamp
import org.poweruptime.backend.core.models.ADatabaseEnumConvertable
import org.poweruptime.backend.core.models.enumerationByCode
import java.time.Instant

enum class MonitorUptimeEventStatus : ADatabaseEnumConvertable {
    UP {
        override val code = "U"
    },
    DOWN {
        override val code = "D"
    },
}

object MonitorUptimeEvent : ULongIdTable("monitor_uptime_event") {
    val monitorId = ulong("monitor_id").references(Monitor.id)
    val effectiveAt = timestamp("effective_at")
    val status = enumerationByCode<MonitorUptimeEventStatus>("status")

    init {
        index(false, monitorId, effectiveAt)
    }
}

data class MonitorUptimeEventRecord(
    val id: ULong,
    val monitorId: ULong,
    val effectiveAt: Instant,
    val status: MonitorUptimeEventStatus,
)

fun MonitorUptimeEvent.rowToMonitorUptimeEventRecord(row: ResultRow): MonitorUptimeEventRecord =
    MonitorUptimeEventRecord(
        id = row[id].value,
        monitorId = row[monitorId],
        effectiveAt = row[effectiveAt],
        status = row[status],
    )
