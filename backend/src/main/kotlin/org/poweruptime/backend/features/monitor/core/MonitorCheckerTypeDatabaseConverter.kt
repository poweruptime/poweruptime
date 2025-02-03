package org.poweruptime.backend.features.monitor.core

import jakarta.persistence.Converter
import org.poweruptime.backend.core.models.ADatabaseEnumConverter

@Converter(autoApply = true)
class MonitorCheckerTypeDatabaseConverter : ADatabaseEnumConverter<MonitorCheckerType>() {
    override fun getKeys(): Array<MonitorCheckerType> = MonitorCheckerType.entries.toTypedArray()
}
