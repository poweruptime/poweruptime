package org.poweruptime.backend.features.info.dto

import jakarta.validation.constraints.NotNull

data class SettingStringDto(
    @get:NotNull val it: String,
)
