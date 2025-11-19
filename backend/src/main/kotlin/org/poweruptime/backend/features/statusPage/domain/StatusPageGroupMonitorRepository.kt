package org.poweruptime.backend.features.statusPage.domain

import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupMonitor
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupMonitorJoinMonitorRecord
import org.poweruptime.backend.features.statusPage.model.rowToStatusPageGroupMonitorJoinMonitorRecord

fun StatusPageGroupMonitor.findByStatusPage(statusPageId: ULong): List<StatusPageGroupMonitorJoinMonitorRecord> =
    innerJoin(Monitor)
        .selectAll()
        .where { StatusPageGroupMonitor.statusPageId eq statusPageId }
        .orderBy(StatusPageGroupMonitor.position, SortOrder.ASC)
        .map {
            StatusPageGroupMonitor.rowToStatusPageGroupMonitorJoinMonitorRecord(it)
        }

fun StatusPageGroupMonitor.findByStatusPage(statusPageId: List<ULong>): List<StatusPageGroupMonitorJoinMonitorRecord> =
    innerJoin(Monitor)
        .selectAll()
        .where { StatusPageGroupMonitor.statusPageId inList statusPageId }
        .orderBy(StatusPageGroupMonitor.position, SortOrder.ASC)
        .map {
            StatusPageGroupMonitor.rowToStatusPageGroupMonitorJoinMonitorRecord(it)
        }
