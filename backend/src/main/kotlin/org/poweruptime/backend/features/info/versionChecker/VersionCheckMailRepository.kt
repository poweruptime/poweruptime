package org.poweruptime.backend.features.info.versionChecker

import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.selectAll

fun VersionCheckMail.findByVersion(version: String): VersionCheckMailRecord? =
    selectAll().where { puVersion eq version }.limit(1).firstOrNull()?.let {
        rowToVersionCheckMailRecord(it)
    }
