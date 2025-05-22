package org.poweruptime.backend.features.monitor.checker.http

import jakarta.persistence.Converter
import org.poweruptime.backend.core.models.ADatabaseEnumConverter

@Converter(autoApply = true)
class HttpMonitorDataAuthTypeDatabaseConverter : ADatabaseEnumConverter<HttpMonitorDataAuthType>() {
    override fun getKeys(): Array<HttpMonitorDataAuthType> =
        HttpMonitorDataAuthType.entries.toTypedArray()
}
