package org.poweruptime.backend.features.info.dto

import java.time.Instant

data class InfoSupportResponse(
    val supportsSince: Instant?,
    val showSupportBadge: Boolean,
)
