package org.poweruptime.backend.features.info.instanceSetting.dto

data class InstanceSupportSettingsResponse(
    val check: Boolean,
    val instanceSettings: InstanceSettingsResponse
)
