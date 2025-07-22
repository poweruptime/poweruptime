package org.poweruptime.backend.features.info.instanceSetting.dto

import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import org.poweruptime.backend.core.utils.Database

data class InstanceSettingSupportDto(
    @get:Size(min = Database.MIN_SUPPORT_LOOKUP_LENGTH, max = Database.MAX_SUPPORT_LOOKUP_LENGTH)
    val supportLookup: String?,
    @get:NotNull val showSupportBadge: Boolean,
)
