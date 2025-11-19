package org.poweruptime.backend.features.statusPage.domain

import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.features.statusPage.model.StatusPageGroup
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupRecord
import org.poweruptime.backend.features.statusPage.model.rowToStatusPageGroupRecord

fun StatusPageGroup.findByStatusPage(statusPageId: ULong): List<StatusPageGroupRecord> =
    selectAll()
        .where { StatusPageGroup.statusPageId eq statusPageId }
        .orderBy(StatusPageGroup.position, SortOrder.ASC)
        .map {
            StatusPageGroup.rowToStatusPageGroupRecord(it)
        }

fun StatusPageGroup.findByStatusPage(statusPageId: List<ULong>): List<StatusPageGroupRecord> =
    selectAll()
        .where { StatusPageGroup.statusPageId inList statusPageId }
        .orderBy(StatusPageGroup.position, SortOrder.ASC)
        .map {
            StatusPageGroup.rowToStatusPageGroupRecord(it)
        }
