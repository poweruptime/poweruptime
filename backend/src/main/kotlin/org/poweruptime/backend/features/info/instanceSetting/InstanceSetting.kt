package org.poweruptime.backend.features.info.instanceSetting

import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.ULongIdTable
import org.poweruptime.backend.core.models.enumerationByCode
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.team.model.SettingKey

object InstanceSetting : ULongIdTable("instance_setting") {
    val key = enumerationByCode<SettingKey>("setting_key")

    val value = varchar("value", Database.MAX_SETTING_VALUE_LENGTH)
}

data class InstanceSettingRecord(val id: ULong, val key: SettingKey, var value: String)

fun InstanceSetting.rowToInstanceSetting(row: ResultRow): InstanceSettingRecord = InstanceSettingRecord(
    id = row[id].value,
    key = row[key],
    value = row[value],
)
