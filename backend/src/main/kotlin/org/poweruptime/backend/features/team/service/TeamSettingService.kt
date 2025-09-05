package org.poweruptime.backend.features.team.service

import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.domain.findByIdOrThrow
import org.poweruptime.backend.features.info.instanceSetting.InstanceSettingService
import org.poweruptime.backend.features.team.domain.findValueByKeyAndTeamId
import org.poweruptime.backend.features.team.model.SettingKey
import org.poweruptime.backend.features.team.model.TeamSettingRecord
import org.poweruptime.backend.features.team.model.TeamSettingTable
import org.poweruptime.backend.features.team.model.rowToTeamSettingRecord
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.ZoneId

@Service
@Transactional(readOnly = true)
class TeamSettingService(
    private val instanceSettingService: InstanceSettingService,
) {
    fun getCheckResultRetentionPeriodInDays(teamId: ULong): Int = getValueByKeyAndTeamId(
        SettingKey.CHECK_RESULT_RETENTION_PERIOD_IN_DAYS,
        teamId,
        instanceSettingService.getCheckResultRetentionPeriodInDays().toString(),
    ).toInt()

    fun setCheckResultRetentionPeriodInDays(teamId: ULong, value: Int) = setValueByKeyAndTeamId(
        SettingKey.CHECK_RESULT_RETENTION_PERIOD_IN_DAYS,
        teamId,
        value.toString(),
    )

    fun getCheckResultLogRetentionPeriodInDays(teamId: ULong): Int = getValueByKeyAndTeamId(
        SettingKey.CHECK_RESULT_LOG_RETENTION_PERIOD_IN_DAYS,
        teamId,
        instanceSettingService.getCheckResultLogRetentionPeriodInDays().toString(),
    ).toInt()

    fun setCheckResultLogRetentionPeriodInDays(teamId: ULong, value: Int) = setValueByKeyAndTeamId(
        SettingKey.CHECK_RESULT_LOG_RETENTION_PERIOD_IN_DAYS,
        teamId,
        value.toString(),
    )

    fun getTimeZone(teamId: ULong): ZoneId = ZoneId.of(
        getValueByKeyAndTeamId(
            SettingKey.TIMEZONE,
            teamId,
            instanceSettingService.getTimeZone().id,
        ),
    )

    fun setTimeZone(teamId: ULong, value: ZoneId) = setValueByKeyAndTeamId(
        SettingKey.TIMEZONE,
        teamId,
        value.id,
    )

    @Transactional
    private fun setValueByKeyAndTeamId(
        key: SettingKey,
        teamId: ULong,
        value: String
    ): TeamSettingRecord {
        val teamSetting = TeamSettingTable.findValueByKeyAndTeamId(key, teamId)
            ?: return TeamSettingTable.insertAndGetId {
                it[TeamSettingTable.key] = key
                it[TeamSettingTable.value] = value
                it[TeamSettingTable.teamId] = teamId
            }.let { id ->
                TeamSettingTable.findByIdOrThrow(id.value) {
                    TeamSettingTable.rowToTeamSettingRecord(it)
                }
            }

        TeamSettingTable.update({ TeamSettingTable.id eq teamSetting.id }) {
            it[TeamSettingTable.value] = value
        }

        return teamSetting.apply {
            this.value = value
        }
    }

    private fun getValueByKeyAndTeamId(
        key: SettingKey,
        teamId: ULong,
        default: String,
    ): String = TeamSettingTable.findValueByKeyAndTeamId(key, teamId)?.value ?: default
}
