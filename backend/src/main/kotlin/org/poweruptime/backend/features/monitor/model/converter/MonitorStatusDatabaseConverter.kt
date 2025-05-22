package org.poweruptime.backend.features.monitor.model.converter

import jakarta.persistence.Converter
import org.poweruptime.backend.core.models.ADatabaseEnumConverter
import org.poweruptime.backend.features.monitor.model.MonitorStatus

@Converter(autoApply = true)
class MonitorStatusDatabaseConverter : ADatabaseEnumConverter<MonitorStatus>() {
    override fun getKeys(): Array<MonitorStatus> = MonitorStatus.entries.toTypedArray()
}
