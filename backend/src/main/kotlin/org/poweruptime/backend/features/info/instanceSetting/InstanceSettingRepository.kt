package org.poweruptime.backend.features.info.instanceSetting

import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.features.team.model.SettingKey

fun InstanceSetting.findByKey(key: SettingKey): InstanceSettingRecord? =
    selectAll().where { InstanceSetting.key eq key }.limit(1).firstOrNull()?.let {
        rowToInstanceSetting(it)
    }
