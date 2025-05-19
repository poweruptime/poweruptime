package org.poweruptime.backend.features.monitor.checker.http

import jakarta.persistence.Converter
import org.poweruptime.backend.core.models.ADatabaseEnumConverter

@Converter(autoApply = true)
class HttpMonitorDataContentTypeDatabaseConverter : ADatabaseEnumConverter<HttpMonitorDataContentType>() {
    override fun getKeys(): Array<HttpMonitorDataContentType> =
        HttpMonitorDataContentType.entries.toTypedArray()
}
