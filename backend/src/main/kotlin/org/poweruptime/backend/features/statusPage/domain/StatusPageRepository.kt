package org.poweruptime.backend.features.statusPage.domain

import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.core.leftJoin
import org.jetbrains.exposed.v1.core.like
import org.jetbrains.exposed.v1.core.lowerCase
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.core.domain.Page
import org.poweruptime.backend.core.domain.deletedFilter
import org.poweruptime.backend.core.domain.pageQuery
import org.poweruptime.backend.core.dto.Pageable
import org.poweruptime.backend.features.fileUpload.File
import org.poweruptime.backend.features.statusPage.model.StatusPage
import org.poweruptime.backend.features.statusPage.model.StatusPageDomainName
import org.poweruptime.backend.features.statusPage.model.StatusPageRecord
import org.poweruptime.backend.features.statusPage.model.rowToStatusPageRecord

fun StatusPage.findByDomainName(domainName: String): StatusPageRecord? = innerJoin(
    StatusPageDomainName,
    { StatusPage.id },
    { StatusPageDomainName.statusPageId },
).leftJoin(File, { File.id }, { imageId })
    .selectAll()
    .where { StatusPageDomainName.name eq domainName }
    .withDistinctOn(StatusPage.id)
    .limit(1)
    .firstOrNull()
    ?.let {
        rowToStatusPageRecord(it)
    }

fun StatusPage.findAll(
    pageable: Pageable,
    teamId: ULong,
    name: String?,
    deleted: Boolean = false,
): Page<StatusPageRecord> {
    var condition: Op<Boolean> = StatusPage.deleted.deletedFilter(deleted) and (StatusPage.teamId eq teamId)

    name?.let {
        condition = condition and (StatusPage.name.lowerCase() like "%${it.lowercase()}%")
    }

    val query = leftJoin(File, { imageId }, { File.id })
        .selectAll()
        .where(condition)

    return pageQuery(
        query,
        pageable,
        sort = {
            when (it) {
                "name" -> StatusPage.name
                "slug" -> StatusPage.publicId
                "createdAt" -> StatusPage.createdAt
                "updatedAt" -> StatusPage.updatedAt
                "deleted" -> StatusPage.deleted
                else -> null
            }
        },
        map = { rowToStatusPageRecord(it) },
    )
}
