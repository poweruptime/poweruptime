package org.poweruptime.backend.features.monitor.domain

import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greater
import org.jetbrains.exposed.v1.core.less
import org.jetbrains.exposed.v1.core.lessEq
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.features.monitor.model.MonitorUptimeEvent
import org.poweruptime.backend.features.monitor.model.MonitorUptimeEventRecord
import org.poweruptime.backend.features.monitor.model.rowToMonitorUptimeEventRecord
import java.time.Instant

fun MonitorUptimeEvent.findLastByMonitorId(monitorId: ULong): MonitorUptimeEventRecord? = selectAll()
    .where { MonitorUptimeEvent.monitorId eq monitorId }
    .orderBy(effectiveAt to SortOrder.DESC, id to SortOrder.DESC)
    .limit(1)
    .firstOrNull()
    ?.let { rowToMonitorUptimeEventRecord(it) }

fun MonitorUptimeEvent.findFirstByMonitorId(monitorId: ULong): MonitorUptimeEventRecord? = selectAll()
    .where { MonitorUptimeEvent.monitorId eq monitorId }
    .orderBy(effectiveAt to SortOrder.ASC, id to SortOrder.ASC)
    .limit(1)
    .firstOrNull()
    ?.let { rowToMonitorUptimeEventRecord(it) }

fun MonitorUptimeEvent.findLastByMonitorIdAtOrBefore(monitorId: ULong, instant: Instant): MonitorUptimeEventRecord? =
    selectAll()
        .where { (MonitorUptimeEvent.monitorId eq monitorId) and (effectiveAt lessEq instant) }
        .orderBy(effectiveAt to SortOrder.DESC, id to SortOrder.DESC)
        .limit(1)
        .firstOrNull()
        ?.let { rowToMonitorUptimeEventRecord(it) }

fun MonitorUptimeEvent.findByMonitorIdBetween(
    monitorId: ULong,
    start: Instant,
    end: Instant,
): List<MonitorUptimeEventRecord> = selectAll()
    .where { (MonitorUptimeEvent.monitorId eq monitorId) and (effectiveAt greater start) and (effectiveAt less end) }
    .orderBy(effectiveAt to SortOrder.ASC, id to SortOrder.ASC)
    .map { rowToMonitorUptimeEventRecord(it) }
