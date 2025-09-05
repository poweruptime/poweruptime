package org.poweruptime.backend.features.info.versionChecker

import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.ULongIdTable
import org.poweruptime.backend.core.utils.Database

object VersionCheckMailTable : ULongIdTable("version_check_mail") {
    val puVersion = varchar("pu_version", Database.MAX_PU_VERSION_LENGTH).uniqueIndex()
}

data class VersionCheckMailRecord(
    val id: ULong,
    val puVersion: String,
)

fun VersionCheckMailTable.rowToVersionCheckMailRecord(row: ResultRow): VersionCheckMailRecord =
    VersionCheckMailRecord(
        id = row[id].value,
        puVersion = row[puVersion],
    )
