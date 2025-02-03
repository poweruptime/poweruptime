package org.poweruptime.backend.features.monitor.checker.http

import jakarta.persistence.Converter
import org.poweruptime.backend.core.models.ADatabaseEnumConverter

@Converter(autoApply = true)
class HttpMonitorCheckerDataAuthTypeDatabaseConverter : ADatabaseEnumConverter<HttpMonitorCheckerDataAuthType>() {
    override fun getKeys(): Array<HttpMonitorCheckerDataAuthType> =
        HttpMonitorCheckerDataAuthType.entries.toTypedArray()
}
