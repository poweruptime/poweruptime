package org.poweruptime.backend.features.instanceSetting

import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import org.poweruptime.backend.core.utils.Database

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
    val supportLookup: String?,
    val showSupportBadge: Boolean,
    val timezone: String,
    val isUserAllowedToCreateTeams: Boolean,
    val checkResultRetentionPeriodInDays: Int,
    val checkResultLogRetentionPeriodInDays: Int,
    val versionCheckEnabled: Boolean,
    val versionCheckAdminMailEnabled: Boolean,
    val versionCheckAdminMailTo: List<String>?,
)

data class InstanceSupportSettingsResponse(
    val check: Boolean,
    val instanceSettings: InstanceSettingsResponse
)

data class InstanceSettingSupportDto(
    @get:Size(min = Database.MIN_SUPPORT_LOOKUP_LENGTH, max = Database.MAX_SUPPORT_LOOKUP_LENGTH)
    val supportLookup: String?,
    @get:NotNull val showSupportBadge: Boolean,
)

data class InstanceSettingRetentionDto(
    @get:NotNull val checkResultRetentionPeriodInDays: Int,
    @get:NotNull val checkResultLogRetentionPeriodInDays: Int
)

data class InstanceSettingVersionCheckDto(
    @get:NotNull val versionCheckEnabled: Boolean,
    @get:NotNull val versionCheckAdminMailEnabled: Boolean,
    @get:Size(min = Database.MIN_VERSION_CHECK_ADMIN_MAILS, max = Database.MAX_VERSION_CHECK_ADMIN_MAILS)
    val versionCheckAdminMailTo: Set<String>?,
)

data class VersionCheckResponse(
    val latestVersion: String?
)
