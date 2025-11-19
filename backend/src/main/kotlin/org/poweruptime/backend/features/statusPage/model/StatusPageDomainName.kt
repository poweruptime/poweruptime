package org.poweruptime.backend.features.statusPage.model

import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.ULongIdTable
import org.poweruptime.backend.core.models.HasModifiers
import org.poweruptime.backend.core.models.HasName
import org.poweruptime.backend.core.models.createdAt
import org.poweruptime.backend.core.models.name
import org.poweruptime.backend.core.models.updatedAt
import org.poweruptime.backend.core.utils.Database
import java.time.Instant

object StatusPageDomainName : ULongIdTable("status_page_domain_name"), HasModifiers, HasName {
    override val createdAt = createdAt()
    override val updatedAt = updatedAt()
    override val name = name(
        length = Database.MAX_DOMAIN_LENGTH,
    ).uniqueIndex()

    val statusPageId = ulong("status_page_id").references(StatusPage.id).index()
}

data class StatusPageDomainNameRecord(
    val id: ULong,
    val createdAt: Instant,
    val updatedAt: Instant,
    val name: String,
    val statusPageId: ULong,
)

fun StatusPageDomainName.rowToStatusPageDomainNameRecord(row: ResultRow): StatusPageDomainNameRecord =
    StatusPageDomainNameRecord(
        id = row[id].value,
        createdAt = row[createdAt],
        updatedAt = row[updatedAt],
        name = row[name],
        statusPageId = row[statusPageId],
    )
