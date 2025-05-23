package org.poweruptime.backend.features.instanceSetting

import org.poweruptime.backend.core.service.AEntityService
import org.poweruptime.backend.features.team.model.SettingKey
import org.springframework.stereotype.Service
import java.time.Instant
import java.time.ZoneId

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

    private var serverSetupTime: Instant? = null
    fun getServerSetupTime(): Instant {
        if (serverSetupTime != null) {
            return serverSetupTime!!
        }

        var value = getValueByKey(SettingKey.SERVER_SETUP_TIME)
        if (value == SettingKey.SERVER_SETUP_TIME.default) {
            value = setValueByKey(SettingKey.SERVER_SETUP_TIME, Instant.now().toString()).value
        }

        serverSetupTime = Instant.parse(value)

        return serverSetupTime!!
    }

    fun getSupportLookup(): String? = getValueByKey(
        SettingKey.SUPPORT_LOOKUP,
    ).let {
        if (it == "null") null else it
    }

    fun setSupportLookup(value: String?) = setValueByKey(
        SettingKey.SUPPORT_LOOKUP,
        value ?: "null",
    )

    fun getSupportsSince(): Instant? {
        val value = getValueByKey(
            SettingKey.SUPPORTS_SINCE,
        )

        if (value == "null") {
            return null
        }

        return Instant.parse(value)
    }

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
