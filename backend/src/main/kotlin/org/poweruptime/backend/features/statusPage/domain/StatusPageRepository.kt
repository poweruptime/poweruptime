package org.poweruptime.backend.features.statusPage.domain

import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.SqlExpressionBuilder.eq
import org.jetbrains.exposed.v1.core.SqlExpressionBuilder.like
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.core.leftJoin
import org.jetbrains.exposed.v1.core.lowerCase
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.core.domain.deletedFilter
import org.poweruptime.backend.core.domain.pageQuery
import org.poweruptime.backend.features.fileUpload.FileTable
import org.poweruptime.backend.features.statusPage.model.StatusPageDomainNameTable
import org.poweruptime.backend.features.statusPage.model.StatusPageRecord
import org.poweruptime.backend.features.statusPage.model.StatusPageTable
import org.poweruptime.backend.features.statusPage.model.rowToStatusPageRecord
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

fun StatusPageTable.findByDomainName(domainName: String): StatusPageRecord? =
    innerJoin(
        StatusPageDomainNameTable,
        { StatusPageTable.id },
        { StatusPageDomainNameTable.statusPageId },
    )
        .leftJoin(FileTable, { FileTable.id }, { StatusPageTable.imageId })
        .selectAll()
        .where { StatusPageDomainNameTable.name eq domainName }
        .withDistinctOn(StatusPageTable.id)
        .limit(1)
        .firstOrNull()
        ?.let {
            StatusPageTable.rowToStatusPageRecord(it)
        }

fun StatusPageTable.findAll(
    pageable: Pageable,
    teamId: ULong,
    name: String?,
    deleted: Boolean = false
): Page<StatusPageRecord> {
    var condition: Op<Boolean> = StatusPageTable.deleted.deletedFilter(deleted) and (StatusPageTable.teamId eq teamId)

    name?.let {
        condition = condition and (StatusPageTable.name.lowerCase() like "%${it.lowercase()}%")
    }

    val query = leftJoin(FileTable, { StatusPageTable.imageId }, { FileTable.id })
        .selectAll().where(condition)

    return pageQuery(
        query,
        pageable,
        sort = {
            when (it) {
                "name" -> StatusPageTable.name
                "slug" -> StatusPageTable.publicId
                "createdAt" -> StatusPageTable.createdAt
                "updatedAt" -> StatusPageTable.updatedAt
                "deleted" -> StatusPageTable.deleted
                else -> null
            }
        },
        map = { rowToStatusPageRecord(it) },
    )
}
