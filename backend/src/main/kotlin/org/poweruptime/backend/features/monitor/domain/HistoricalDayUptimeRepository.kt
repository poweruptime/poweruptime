package org.poweruptime.backend.features.monitor.domain

import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greaterEq
import org.jetbrains.exposed.v1.core.lessEq
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.features.monitor.model.HistoricalDayUptime
import org.poweruptime.backend.features.monitor.model.HistoricalDayUptimeRecord
import org.poweruptime.backend.features.monitor.model.rowToHistoricalDayUptimeRecord
import java.time.LocalDate

fun HistoricalDayUptime.findByMonitorIdBetweenDates(
    monitorId: ULong,
    start: LocalDate,
    end: LocalDate,
): List<HistoricalDayUptimeRecord> =
    selectAll()
        .where {
            (HistoricalDayUptime.monitorId eq monitorId) and (date greaterEq start) and (date lessEq end)
        }.orderBy(
            date,
            SortOrder.DESC,
        ).map {
            HistoricalDayUptime.rowToHistoricalDayUptimeRecord(it)
        }
