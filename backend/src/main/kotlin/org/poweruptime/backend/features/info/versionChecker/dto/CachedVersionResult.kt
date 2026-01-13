package org.poweruptime.backend.features.info.versionChecker.dto

import java.time.Instant

data class CachedVersionResult(
    val result: VersionCheckResponse?,
    val timestamp: Instant
)
