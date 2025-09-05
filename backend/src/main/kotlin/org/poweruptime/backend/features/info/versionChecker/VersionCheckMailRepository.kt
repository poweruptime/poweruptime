package org.poweruptime.backend.features.info.versionChecker

import org.jetbrains.exposed.v1.jdbc.selectAll

fun VersionCheckMailTable.findByVersion(version: String): VersionCheckMailRecord? =
    selectAll().where { VersionCheckMailTable.puVersion eq version }.limit(1).firstOrNull()?.let {
        VersionCheckMailTable.rowToVersionCheckMailRecord(it)
    }
