package org.poweruptime.backend.features.info.instanceSetting

import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.features.team.model.SettingKey
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.ZoneId

@Suppress("TooManyFunctions")
@Service
@Transactional(readOnly = true)
class InstanceSettingService {
    fun getCheckResultRetentionPeriodInDays(): Int = getValueByKey(
        SettingKey.CHECK_RESULT_RETENTION_PERIOD_IN_DAYS,
    ).toInt()

    @Transactional
    fun setCheckResultRetentionPeriodInDays(value: Int) = setValueByKey(
        SettingKey.CHECK_RESULT_RETENTION_PERIOD_IN_DAYS,
        value.toString(),
    )

    fun getCheckResultLogRetentionPeriodInDays(): Int = getValueByKey(
        SettingKey.CHECK_RESULT_LOG_RETENTION_PERIOD_IN_DAYS,
    ).toInt()

    @Transactional
    fun setCheckResultLogRetentionPeriodInDays(value: Int) = setValueByKey(
        SettingKey.CHECK_RESULT_LOG_RETENTION_PERIOD_IN_DAYS,
        value.toString(),
    )

    @Transactional
    fun getServerSetupTime(): Instant {
        val raw = getValueByKey(SettingKey.SERVER_SETUP_TIME).let { stored ->
            if (stored == SettingKey.SERVER_SETUP_TIME.default) {
                val value = Instant.now().toString()
                setValueByKey(
                    SettingKey.SERVER_SETUP_TIME,
                    value,
                )
                value
            } else {
                stored
            }
        }
        return Instant.parse(raw)
    }

    fun getSupportLookup(): String? = getValueByKey(
        SettingKey.SUPPORT_LOOKUP,
    ).takeUnless { it == "null" }

    @Transactional
    fun setSupportLookup(value: String?) = setValueByKey(
        SettingKey.SUPPORT_LOOKUP,
        value ?: "null",
    )

    fun getSupportsSince(): Instant? = getValueByKey(
        SettingKey.SUPPORTS_SINCE,
    ).takeUnless { it == "null" }?.let { Instant.parse(it) }

    @Transactional
    fun setSupportSince(value: Instant?) = setValueByKey(
        SettingKey.SUPPORTS_SINCE,
        value?.toString() ?: "null",
    )

    fun getShowSupportBadge(): Boolean = getValueByKey(
        SettingKey.SHOW_SUPPORT_BADGE,
    ).toBoolean()

    @Transactional
    fun setShowSupportBadge(value: Boolean) = setValueByKey(
        SettingKey.SHOW_SUPPORT_BADGE,
        value.toString(),
    )

    fun getTimeZone(): ZoneId = ZoneId.of(
        getValueByKey(SettingKey.TIMEZONE),
    )

    @Transactional
    fun setTimeZone(value: ZoneId) = setValueByKey(
        SettingKey.TIMEZONE,
        value.id,
    )

    fun getUserAllowedToCreateTeams(): Boolean = getValueByKey(
        SettingKey.USERS_ALLOWED_TO_CREATE_TEAMS,
    ).toBoolean()

    @Transactional
    fun setUserAllowedToCreateTeams(value: Boolean) = setValueByKey(
        SettingKey.USERS_ALLOWED_TO_CREATE_TEAMS,
        value.toString(),
    )

    fun getVersionCheckEnabled(): Boolean = getValueByKey(
        SettingKey.VERSION_CHECK_ENABLED,
    ).toBoolean()

    @Transactional
    fun setVersionCheckEnabled(value: Boolean) = setValueByKey(
        SettingKey.VERSION_CHECK_ENABLED,
        value.toString(),
    )

    fun getVersionCheckAdminMailEnabled(): Boolean = getValueByKey(
        SettingKey.VERSION_CHECK_ADMIN_MAIL_ENABLED,
    ).toBoolean()

    @Transactional
    fun setVersionCheckAdminMailEnabled(value: Boolean) = setValueByKey(
        SettingKey.VERSION_CHECK_ADMIN_MAIL_ENABLED,
        value.toString(),
    )

    fun getVersionCheckAdminMailTo(): List<String>? = getValueByKey(
        SettingKey.VERSION_CHECK_ADMIN_MAIL_TO,
    ).takeUnless { it == "null" }?.split(",")

    @Transactional
    fun setVersionCheckAdminMailTo(value: Set<String>?) = setValueByKey(
        SettingKey.VERSION_CHECK_ADMIN_MAIL_TO,
        value?.joinToString(",") { it.trim() } ?: "null",
    )

    fun getShowNewVersionDialog(): Boolean = getValueByKey(
        SettingKey.SHOW_NEW_VERSION_DIALOG,
    ).toBoolean()

    @Transactional
    fun setShowNewVersionDialog(value: Boolean) = setValueByKey(
        SettingKey.SHOW_NEW_VERSION_DIALOG,
        value.toString(),
    )

    private fun setValueByKey(
        key: SettingKey,
        value: String
    ) {
        val instanceSetting = InstanceSetting.findByKey(key)

        if (instanceSetting == null) {
            InstanceSetting.insertAndGetId {
                it[InstanceSetting.value] = value
                it[InstanceSetting.key] = key
            }

            return
        }

        InstanceSetting.update({ InstanceSetting.id eq instanceSetting.id }) {
            it[InstanceSetting.value] = value
        }
    }

    private fun getByKey(
        key: SettingKey,
    ): InstanceSettingRecord? = InstanceSetting.findByKey(key)

    private fun getValueByKey(
        key: SettingKey,
    ): String = getByKey(key)?.value ?: key.default
}
