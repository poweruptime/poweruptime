package org.poweruptime.backend.features.statusPage.domain

import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.features.statusPage.model.StatusPageDomainNameRecord
import org.poweruptime.backend.features.statusPage.model.StatusPageDomainNameTable
import org.poweruptime.backend.features.statusPage.model.rowToStatusPageDomainNameRecord

fun StatusPageDomainNameTable.findByStatusPage(statusPageId: ULong): List<StatusPageDomainNameRecord> =
    selectAll().where { StatusPageDomainNameTable.statusPageId eq statusPageId }.map {
        StatusPageDomainNameTable.rowToStatusPageDomainNameRecord(it)
    }

fun StatusPageDomainNameTable.findByStatusPage(statusPageId: List<ULong>): List<StatusPageDomainNameRecord> =
    selectAll().where { StatusPageDomainNameTable.statusPageId inList statusPageId }.map {
        StatusPageDomainNameTable.rowToStatusPageDomainNameRecord(it)
    }
