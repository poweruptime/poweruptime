package org.poweruptime.backend.features.team.service

import org.poweruptime.backend.core.service.AEntityService
import org.poweruptime.backend.features.instanceSetting.InstanceSettingService
import org.poweruptime.backend.features.team.domain.TeamSettingRepository
import org.poweruptime.backend.features.team.model.SettingKey
import org.poweruptime.backend.features.team.model.TeamSetting
import org.springframework.stereotype.Service
import java.time.ZoneId

@Service
class TeamSettingService(
    private val teamSettingRepository: TeamSettingRepository,
    private val instanceSettingService: InstanceSettingService,
    private val teamService: TeamService,
) : AEntityService<TeamSetting>(
    teamSettingRepository,
) {
    fun getCheckResultRetentionPeriodInDays(teamId: String): Int = getValueByKeyAndTeamId(
        SettingKey.CHECK_RESULT_RETENTION_PERIOD_IN_DAYS,
        teamId,
        instanceSettingService.getCheckResultRetentionPeriodInDays().toString(),
    ).toInt()

    fun setCheckResultRetentionPeriodInDays(teamId: String, value: Int) = setValueByKeyAndTeamId(
        SettingKey.CHECK_RESULT_RETENTION_PERIOD_IN_DAYS,
        teamId,
        value.toString(),
    )

    fun getCheckResultLogRetentionPeriodInDays(teamId: String): Int = getValueByKeyAndTeamId(
        SettingKey.CHECK_RESULT_LOG_RETENTION_PERIOD_IN_DAYS,
        teamId,
        instanceSettingService.getCheckResultLogRetentionPeriodInDays().toString(),
    ).toInt()

    fun setCheckResultLogRetentionPeriodInDays(teamId: String, value: Int) = setValueByKeyAndTeamId(
        SettingKey.CHECK_RESULT_LOG_RETENTION_PERIOD_IN_DAYS,
        teamId,
        value.toString(),
    )

    fun getTimeZone(teamId: String): ZoneId = ZoneId.of(
        getValueByKeyAndTeamId(
            SettingKey.TIMEZONE,
            teamId,
            instanceSettingService.getTimeZone().id,
        ),
    )

    fun setTimeZone(teamId: String, value: ZoneId) = setValueByKeyAndTeamId(
        SettingKey.TIMEZONE,
        teamId,
        value.id,
    )

    private fun setValueByKeyAndTeamId(
        key: SettingKey,
        teamId: String,
        value: String
    ): TeamSetting {
        val teamSetting = teamSettingRepository.findValueByKeyAndTeamId(key, teamId)?.apply {
            this.value = value
        } ?: TeamSetting(
            key = key,
            value = value,
            team = teamService.getByIdOrThrow(teamId),
        )

        return teamSettingRepository.save(teamSetting)
    }

    private fun getValueByKeyAndTeamId(
        key: SettingKey,
        teamId: String,
        default: String,
    ): String = teamSettingRepository.findValueByKeyAndTeamId(key, teamId)?.value ?: default
}
