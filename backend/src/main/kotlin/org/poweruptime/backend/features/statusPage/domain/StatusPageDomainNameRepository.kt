package org.poweruptime.backend.features.statusPage.domain

import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.features.statusPage.model.StatusPageDomainName
import org.poweruptime.backend.features.statusPage.model.StatusPageDomainNameRecord
import org.poweruptime.backend.features.statusPage.model.rowToStatusPageDomainNameRecord

fun StatusPageDomainName.findByStatusPage(statusPageId: ULong): List<StatusPageDomainNameRecord> =
    selectAll().where { StatusPageDomainName.statusPageId eq statusPageId }.map {
        rowToStatusPageDomainNameRecord(it)
    }

fun StatusPageDomainName.findByStatusPage(statusPageId: List<ULong>): List<StatusPageDomainNameRecord> =
    selectAll().where { StatusPageDomainName.statusPageId inList statusPageId }.map {
        rowToStatusPageDomainNameRecord(it)
    }
