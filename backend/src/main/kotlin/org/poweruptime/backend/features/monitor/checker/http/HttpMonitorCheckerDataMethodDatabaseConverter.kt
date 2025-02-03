package org.poweruptime.backend.features.monitor.checker.http

import jakarta.persistence.Converter
import org.poweruptime.backend.core.models.ADatabaseEnumConverter

@Converter(autoApply = true)
class HttpMonitorCheckerDataMethodDatabaseConverter : ADatabaseEnumConverter<HttpMonitorCheckerDataMethod>() {
    override fun getKeys(): Array<HttpMonitorCheckerDataMethod> = HttpMonitorCheckerDataMethod.entries.toTypedArray()
}
