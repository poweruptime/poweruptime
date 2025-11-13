package org.poweruptime.backend.features.team.domain

import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.features.team.model.SettingKey
import org.poweruptime.backend.features.team.model.TeamSettingRecord
import org.poweruptime.backend.features.team.model.TeamSettingTable
import org.poweruptime.backend.features.team.model.rowToTeamSettingRecord

fun TeamSettingTable.findValueByKeyAndTeamId(
    key: SettingKey,
    teamId: ULong
): TeamSettingRecord? = TeamSettingTable.selectAll().where {
    (TeamSettingTable.key eq key) and (TeamSettingTable.teamId eq teamId)
}.firstOrNull()?.let {
    TeamSettingTable.rowToTeamSettingRecord(it)
}
