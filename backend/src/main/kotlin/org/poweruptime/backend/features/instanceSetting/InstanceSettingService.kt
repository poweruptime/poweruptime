package org.poweruptime.backend.features.instanceSetting

import org.poweruptime.backend.core.service.AEntityService
import org.poweruptime.backend.features.team.model.SettingKey
import org.springframework.stereotype.Service
import java.time.ZoneId

@Service
class InstanceSettingService(
    private val instanceSettingRepository: InstanceSettingRepository,
) : AEntityService<InstanceSetting>(instanceSettingRepository) {
    fun getUserAllowedToCreateTeams(): Boolean = getValueByKeyAndTeamId(
        SettingKey.USERS_ALLOWED_TO_CREATE_TEAMS,
        false.toString(),
    ).toBoolean()

    fun setUserAllowedToCreateTeams(value: Boolean) = setValueByKeyAndTeamId(
        SettingKey.USERS_ALLOWED_TO_CREATE_TEAMS,
        value.toString(),
    )

    fun getCheckResultRetentionPeriodInDays(): Int = getValueByKeyAndTeamId(
        SettingKey.CHECK_RESULT_RETENTION_PERIOD_IN_DAYS,
        180.toString(), // 6 months
    ).toInt()

    fun setCheckResultRetentionPeriodInDays(value: Int) = setValueByKeyAndTeamId(
        SettingKey.CHECK_RESULT_RETENTION_PERIOD_IN_DAYS,
        value.toString(),
    )

    fun getCheckResultLogRetentionPeriodInDays(): Int = getValueByKeyAndTeamId(
        SettingKey.CHECK_RESULT_LOG_RETENTION_PERIOD_IN_DAYS,
        90.toString(), // 3 months
    ).toInt()

    fun setCheckResultLogRetentionPeriodInDays(value: Int) = setValueByKeyAndTeamId(
        SettingKey.CHECK_RESULT_LOG_RETENTION_PERIOD_IN_DAYS,
        value.toString(),
    )

    fun getTimeZone(): ZoneId = ZoneId.of(
        getValueByKeyAndTeamId(
            SettingKey.TIMEZONE,
            ZoneId.systemDefault().id,
        ),
    )

    fun setTimeZone(value: ZoneId) = setValueByKeyAndTeamId(
        SettingKey.TIMEZONE,
        value.id,
    )

    private fun setValueByKeyAndTeamId(
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

    private fun getValueByKeyAndTeamId(
        key: SettingKey,
        default: String,
    ): String = instanceSettingRepository.findValueByKey(key)?.value ?: default
}
