package org.poweruptime.backend.features.statusPage.domain

import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.features.monitor.model.MonitorTable
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupMonitorJoinMonitorRecord
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupMonitorTable
import org.poweruptime.backend.features.statusPage.model.rowToStatusPageGroupMonitorJoinMonitorRecord

fun StatusPageGroupMonitorTable.findByStatusPage(statusPageId: ULong): List<StatusPageGroupMonitorJoinMonitorRecord> =
    innerJoin(MonitorTable)
        .selectAll()
        .where { StatusPageGroupMonitorTable.statusPageId eq statusPageId }
        .orderBy(StatusPageGroupMonitorTable.position, SortOrder.ASC)
        .map {
            StatusPageGroupMonitorTable.rowToStatusPageGroupMonitorJoinMonitorRecord(it)
        }

fun StatusPageGroupMonitorTable.findByStatusPage(statusPageId: List<ULong>):
    List<StatusPageGroupMonitorJoinMonitorRecord> =
    innerJoin(MonitorTable)
        .selectAll()
        .where { StatusPageGroupMonitorTable.statusPageId inList statusPageId }
        .orderBy(StatusPageGroupMonitorTable.position, SortOrder.ASC)
        .map {
            StatusPageGroupMonitorTable.rowToStatusPageGroupMonitorJoinMonitorRecord(it)
        }
