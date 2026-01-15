package org.poweruptime.backend.features.info.instanceSetting.dto

data class TimezoneInfo(
    val id: String,
    val offset: String,
)

data class InstanceAvailableTimezonesResponse(
    val availableTimezones: List<TimezoneInfo>,
)
