package org.poweruptime.backend.features.monitor.checker.http

import jakarta.persistence.Converter
import org.poweruptime.backend.core.models.ADatabaseEnumConverter

@Converter(autoApply = true)
class HttpMonitorCheckerDataContentTypeDatabaseConverter : ADatabaseEnumConverter<HttpMonitorCheckerDataContentType>() {
    override fun getKeys(): Array<HttpMonitorCheckerDataContentType> =
        HttpMonitorCheckerDataContentType.entries.toTypedArray()
}
