package org.poweruptime.backend.features.info.instanceSetting.dto

data class InstanceSettingsResponse(
    val supportLookup: String?,
    val showSupportBadge: Boolean,
    val timezone: String,
    val isUserAllowedToCreateTeams: Boolean,
    val checkResultRetentionPeriodInDays: Int,
    val checkResultLogRetentionPeriodInDays: Int,
    val versionCheckEnabled: Boolean,
    val versionCheckAdminMailEnabled: Boolean,
    val versionCheckAdminMailTo: List<String>?,
    val showNewVersionDialog: Boolean,
)
