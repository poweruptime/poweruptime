package org.poweruptime.backend.features.info.versionChecker

import java.time.Instant

data class CachedVersionResult(
    val result: String?,
    val timestamp: Instant
)
