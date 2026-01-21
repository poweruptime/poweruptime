package org.poweruptime.backend.features.team.model

import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.ULongIdTable
import org.poweruptime.backend.core.models.enumerationByCode
import org.poweruptime.backend.core.utils.Database

object TeamSetting : ULongIdTable("team_setting") {
    val key = enumerationByCode<SettingKey>("setting_key")

    val value = varchar("value", Database.MAX_SETTING_VALUE_LENGTH)

    val teamId = ulong("team_id").references(Team.id).index()
}

data class TeamSettingRecord(val id: ULong, val key: SettingKey, var value: String, val teamId: ULong)

fun TeamSetting.rowToTeamSettingRecord(row: ResultRow): TeamSettingRecord = TeamSettingRecord(
    id = row[id].value,
    key = row[key],
    value = row[value],
    teamId = row[teamId],
)
