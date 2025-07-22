package org.poweruptime.backend.features.info.instanceSetting.dto

import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import org.poweruptime.backend.core.utils.Database

data class InstanceSettingVersionCheckDto(
    @get:NotNull val versionCheckEnabled: Boolean,
    @get:NotNull val versionCheckAdminMailEnabled: Boolean,
    @get:Size(min = Database.MIN_VERSION_CHECK_ADMIN_MAILS, max = Database.MAX_VERSION_CHECK_ADMIN_MAILS)
    val versionCheckAdminMailTo: Set<String>?,
)
