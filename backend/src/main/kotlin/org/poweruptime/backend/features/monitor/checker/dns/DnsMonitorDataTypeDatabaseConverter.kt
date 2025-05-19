package org.poweruptime.backend.features.monitor.checker.dns

import jakarta.persistence.Converter
import org.poweruptime.backend.core.models.ADatabaseEnumConverter

@Converter(autoApply = true)
class DnsMonitorDataTypeDatabaseConverter : ADatabaseEnumConverter<DnsMonitorDataType>() {
    override fun getKeys(): Array<DnsMonitorDataType> = DnsMonitorDataType.entries.toTypedArray()
}
