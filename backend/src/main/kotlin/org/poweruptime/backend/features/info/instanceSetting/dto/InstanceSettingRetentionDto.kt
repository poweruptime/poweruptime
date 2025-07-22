package org.poweruptime.backend.features.info.instanceSetting.dto

import jakarta.validation.constraints.NotNull

data class InstanceSettingRetentionDto(
    @get:NotNull val checkResultRetentionPeriodInDays: Int,
    @get:NotNull val checkResultLogRetentionPeriodInDays: Int
)
