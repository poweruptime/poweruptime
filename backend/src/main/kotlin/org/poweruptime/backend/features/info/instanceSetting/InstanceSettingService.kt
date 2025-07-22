package org.poweruptime.backend.features.info.instanceSetting

import org.poweruptime.backend.core.service.AEntityService
import org.poweruptime.backend.features.team.model.SettingKey
import org.springframework.stereotype.Service
import java.time.Instant
import java.time.ZoneId

@Suppress("TooManyFunctions")
@Service
class InstanceSettingService(
    private val instanceSettingRepository: InstanceSettingRepository,
) : AEntityService<InstanceSetting>(instanceSettingRepository) {
    fun getCheckResultRetentionPeriodInDays(): Int = getValueByKey(
        SettingKey.CHECK_RESULT_RETENTION_PERIOD_IN_DAYS,
    ).toInt()

    fun setCheckResultRetentionPeriodInDays(value: Int) = setValueByKey(
        SettingKey.CHECK_RESULT_RETENTION_PERIOD_IN_DAYS,
        value.toString(),
    )

    fun getCheckResultLogRetentionPeriodInDays(): Int = getValueByKey(
        SettingKey.CHECK_RESULT_LOG_RETENTION_PERIOD_IN_DAYS,
    ).toInt()

    fun setCheckResultLogRetentionPeriodInDays(value: Int) = setValueByKey(
        SettingKey.CHECK_RESULT_LOG_RETENTION_PERIOD_IN_DAYS,
        value.toString(),
    )

    val serverSetupTime: Instant by lazy {
        val raw = getValueByKey(SettingKey.SERVER_SETUP_TIME).let { stored ->
            if (stored == SettingKey.SERVER_SETUP_TIME.default) {
                setValueByKey(
                    SettingKey.SERVER_SETUP_TIME,
                    Instant.now().toString(),
                ).value
            } else {
                stored
            }
        }
        Instant.parse(raw)
    }

    fun getSupportLookup(): String? = getValueByKey(
        SettingKey.SUPPORT_LOOKUP,
    ).takeUnless { it == "null" }

    fun setSupportLookup(value: String?) = setValueByKey(
        SettingKey.SUPPORT_LOOKUP,
        value ?: "null",
    )

    fun getSupportsSince(): Instant? = getValueByKey(
        SettingKey.SUPPORTS_SINCE,
    ).takeUnless { it == "null" }?.let { Instant.parse(it) }

    fun setSupportSince(value: Instant?) = setValueByKey(
        SettingKey.SUPPORTS_SINCE,
        value?.toString() ?: "null",
    )

    fun getShowSupportBadge(): Boolean = getValueByKey(
        SettingKey.SHOW_SUPPORT_BADGE,
    ).toBoolean()

    fun setShowSupportBadge(value: Boolean) = setValueByKey(
        SettingKey.SHOW_SUPPORT_BADGE,
        value.toString(),
    )

    fun getTimeZone(): ZoneId = ZoneId.of(
        getValueByKey(SettingKey.TIMEZONE),
    )

    fun setTimeZone(value: ZoneId) = setValueByKey(
        SettingKey.TIMEZONE,
        value.id,
    )

    fun getUserAllowedToCreateTeams(): Boolean = getValueByKey(
        SettingKey.USERS_ALLOWED_TO_CREATE_TEAMS,
    ).toBoolean()

    fun setUserAllowedToCreateTeams(value: Boolean) = setValueByKey(
        SettingKey.USERS_ALLOWED_TO_CREATE_TEAMS,
        value.toString(),
    )

    fun getVersionCheckEnabled(): Boolean = getValueByKey(
        SettingKey.VERSION_CHECK_ENABLED,
    ).toBoolean()

    fun setVersionCheckEnabled(value: Boolean) = setValueByKey(
        SettingKey.VERSION_CHECK_ENABLED,
        value.toString(),
    )

    fun getVersionCheckAdminMailEnabled(): Boolean = getValueByKey(
        SettingKey.VERSION_CHECK_ADMIN_MAIL_ENABLED,
    ).toBoolean()

    fun setVersionCheckAdminMailEnabled(value: Boolean) = setValueByKey(
        SettingKey.VERSION_CHECK_ADMIN_MAIL_ENABLED,
        value.toString(),
    )

    fun getVersionCheckAdminMailTo(): List<String>? = getValueByKey(
        SettingKey.VERSION_CHECK_ADMIN_MAIL_TO,
    ).takeUnless { it == "null" }?.split(",")

    fun setVersionCheckAdminMailTo(value: Set<String>?) = setValueByKey(
        SettingKey.VERSION_CHECK_ADMIN_MAIL_TO,
        value?.joinToString(",") { it.trim() } ?: "null",
    )

    fun getShowNewVersionDialog(): Boolean = getValueByKey(
        SettingKey.SHOW_NEW_VERSION_DIALOG,
    ).toBoolean()

    fun setShowNewVersionDialog(value: Boolean) = setValueByKey(
        SettingKey.SHOW_NEW_VERSION_DIALOG,
        value.toString(),
    )

    private fun setValueByKey(
        key: SettingKey,
        value: String
    ): InstanceSetting {
        val instanceSetting = instanceSettingRepository.findValueByKey(key)?.apply {
            this.value = value
        } ?: InstanceSetting(
            key = key,
            value = value,
        )

        return save(instanceSetting)
    }

    private fun getValueByKey(
        key: SettingKey,
    ): String = instanceSettingRepository.findValueByKey(key)?.value ?: key.default
}
