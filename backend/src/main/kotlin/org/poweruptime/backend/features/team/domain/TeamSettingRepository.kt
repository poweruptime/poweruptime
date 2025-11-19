package org.poweruptime.backend.features.team.domain

import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.features.team.model.SettingKey
import org.poweruptime.backend.features.team.model.TeamSetting
import org.poweruptime.backend.features.team.model.TeamSettingRecord
import org.poweruptime.backend.features.team.model.rowToTeamSettingRecord

fun TeamSetting.findValueByKeyAndTeamId(
    key: SettingKey,
    teamId: ULong
): TeamSettingRecord? = selectAll().where {
    (TeamSetting.key eq key) and (TeamSetting.teamId eq teamId)
}
    .limit(1)
    .firstOrNull()
    ?.let {
        rowToTeamSettingRecord(it)
    }
