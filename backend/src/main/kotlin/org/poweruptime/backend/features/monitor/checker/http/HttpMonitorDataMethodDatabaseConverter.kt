package org.poweruptime.backend.features.monitor.checker.http

import jakarta.persistence.Converter
import org.poweruptime.backend.core.models.ADatabaseEnumConverter

@Converter(autoApply = true)
class HttpMonitorDataMethodDatabaseConverter : ADatabaseEnumConverter<HttpMonitorDataMethod>() {
    override fun getKeys(): Array<HttpMonitorDataMethod> = HttpMonitorDataMethod.entries.toTypedArray()
}
