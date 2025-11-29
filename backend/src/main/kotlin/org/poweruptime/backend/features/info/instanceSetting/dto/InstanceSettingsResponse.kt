package org.poweruptime.backend.features.info.instanceSetting.dto

import com.fasterxml.jackson.annotation.JsonProperty

data class InstanceSettingsResponse(
    val supportLookup: String?,
    val showSupportBadge: Boolean,
    val timezone: String,
    @JsonProperty("isUserAllowedToCreateTeams") val isUserAllowedToCreateTeams: Boolean,
    val checkResultRetentionPeriodInDays: Int,
    val checkResultLogRetentionPeriodInDays: Int,
    val versionCheckEnabled: Boolean,
    val versionCheckAdminMailEnabled: Boolean,
    val versionCheckAdminMailTo: List<String>?,
    val showNewVersionDialog: Boolean,
)
