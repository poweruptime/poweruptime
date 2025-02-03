package org.poweruptime.backend.features.instanceSetting

import jakarta.validation.constraints.NotNull

data class SettingBooleanSetDto(
    @get:NotNull val value: Boolean,
)

data class SettingStringSetDto(
    @get:NotNull val value: String,
)

data class SettingIntSetDto(
    @get:NotNull val value: Int
)

data class InstanceAvailableTimezonesResponse(
    val availableTimezones: Set<String>,
)

data class InstanceSettingsResponse(
    val timezone: String,
    val isUserAllowedToCreateTeams: Boolean,
    val checkResultRetentionPeriodInDays: Int,
    val checkResultLogRetentionPeriodInDays: Int,
)
