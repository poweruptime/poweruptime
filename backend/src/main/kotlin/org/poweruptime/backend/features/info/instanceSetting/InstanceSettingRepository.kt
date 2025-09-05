package org.poweruptime.backend.features.info.instanceSetting

import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.features.team.model.SettingKey

fun InstanceSettingTable.findByKey(key: SettingKey): InstanceSettingRecord? =
    selectAll().where { InstanceSettingTable.key eq key }.limit(1).firstOrNull()?.let {
        rowToInstanceSetting(it)
    }
