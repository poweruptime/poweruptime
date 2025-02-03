package org.poweruptime.backend.features.monitor.checker.dns

import jakarta.persistence.Converter
import org.poweruptime.backend.core.models.ADatabaseEnumConverter

@Converter(autoApply = true)
class DnsMonitorCheckerDataTypeDatabaseConverter : ADatabaseEnumConverter<DnsMonitorCheckerDataType>() {
    override fun getKeys(): Array<DnsMonitorCheckerDataType> = DnsMonitorCheckerDataType.entries.toTypedArray()
}
