package org.poweruptime.backend.features.statusPage.domain

import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupRecord
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupTable
import org.poweruptime.backend.features.statusPage.model.rowToStatusPageGroupRecord

fun StatusPageGroupTable.findByStatusPage(statusPageId: ULong): List<StatusPageGroupRecord> =
    selectAll()
        .where { StatusPageGroupTable.statusPageId eq statusPageId }
        .orderBy(StatusPageGroupTable.position, SortOrder.ASC)
        .map {
            StatusPageGroupTable.rowToStatusPageGroupRecord(it)
        }

fun StatusPageGroupTable.findByStatusPage(statusPageId: List<ULong>): List<StatusPageGroupRecord> =
    selectAll()
        .where { StatusPageGroupTable.statusPageId inList statusPageId }
        .orderBy(StatusPageGroupTable.position, SortOrder.ASC)
        .map {
            StatusPageGroupTable.rowToStatusPageGroupRecord(it)
        }
