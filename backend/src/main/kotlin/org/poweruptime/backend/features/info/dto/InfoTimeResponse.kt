package org.poweruptime.backend.features.info.dto

import java.time.Instant

class InfoTimeResponse(
    val serverTime: Instant,
    val serverStartTime: Instant,
    val serverSetupTime: Instant,
)
