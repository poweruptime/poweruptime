package org.poweruptime.backend.features.monitor.model

import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.ULongIdTable
import org.jetbrains.exposed.v1.javatime.date
import java.math.BigDecimal
import java.time.LocalDate

const val PRECISION = 7
const val SCALE = 4

object HistoricalDayUptimeTable : ULongIdTable("historical_day_uptime") {
    val monitorId = ulong("monitor_id").references(MonitorTable.id).index()

    val date = date("date")

    val uptime = decimal("uptime", PRECISION, SCALE)

    init {
        index(true, date, monitorId)
    }
}

data class HistoricalDayUptimeRecord(
    val id: ULong,
    val monitorId: ULong,
    val date: LocalDate,
    val uptime: BigDecimal
)

fun HistoricalDayUptimeTable.rowToHistoricalDayUptimeRecord(row: ResultRow): HistoricalDayUptimeRecord =
    HistoricalDayUptimeRecord(
        id = row[id].value,
        monitorId = row[monitorId],
        date = row[date],
        uptime = row[uptime],
    )
