package org.poweruptime.backend.features.monitor.model.converter

import jakarta.persistence.Converter
import org.poweruptime.backend.core.models.ADatabaseEnumConverter
import org.poweruptime.backend.features.monitor.model.MonitorType

@Converter(autoApply = true)
class MonitorDataTypeDatabaseConverter : ADatabaseEnumConverter<MonitorType>() {
    override fun getKeys(): Array<MonitorType> = MonitorType.entries.toTypedArray()
}
