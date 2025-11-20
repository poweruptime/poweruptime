package org.poweruptime.backend.features.monitor.model

import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.ULongIdTable
import org.jetbrains.exposed.v1.javatime.date
import java.math.BigDecimal
import java.time.LocalDate

/*
|--6--| <- PRECISION
100.000
    |3| <- SCALE
 */

const val PRECISION = 6
const val PRECISION_SCALE = 3

object HistoricalDayUptime : ULongIdTable("historical_day_uptime") {
    val monitorId = ulong("monitor_id").references(Monitor.id).index()

    val date = date("date")

    val uptime = decimal("uptime", PRECISION, PRECISION_SCALE)

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

fun HistoricalDayUptime.rowToHistoricalDayUptimeRecord(row: ResultRow): HistoricalDayUptimeRecord =
    HistoricalDayUptimeRecord(
        id = row[id].value,
        monitorId = row[monitorId],
        date = row[date],
        uptime = row[uptime],
    )
