package org.poweruptime.backend.features.monitor.domain

import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.features.monitor.model.HistoricalDayUptimeRecord
import org.poweruptime.backend.features.monitor.model.HistoricalDayUptimeTable
import org.poweruptime.backend.features.monitor.model.rowToHistoricalDayUptimeRecord
import java.time.LocalDate

fun HistoricalDayUptimeTable.findByMonitorIdBetweenDates(
    monitorId: ULong,
    start: LocalDate,
    end: LocalDate,
): List<HistoricalDayUptimeRecord> =
    selectAll()
        .where {
            (HistoricalDayUptimeTable.monitorId eq monitorId) and (date greaterEq start) and (date lessEq end)
        }.orderBy(
            date,
            SortOrder.DESC,
        ).map {
            HistoricalDayUptimeTable.rowToHistoricalDayUptimeRecord(it)
        }
