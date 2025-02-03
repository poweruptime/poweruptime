package org.poweruptime.backend.features.team.dto

data class TeamSettingsResponse(
    val timezone: String,
    val checkResultRetentionPeriodInDays: Int,
    val checkResultLogRetentionPeriodInDays: Int,
)
