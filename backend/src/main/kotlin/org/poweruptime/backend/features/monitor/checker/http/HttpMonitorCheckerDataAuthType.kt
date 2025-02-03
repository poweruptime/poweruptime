package org.poweruptime.backend.features.monitor.checker.http

import org.poweruptime.backend.core.models.ADatabaseEnumConvertable

enum class HttpMonitorCheckerDataAuthType : ADatabaseEnumConvertable {
    BASIC {
        override val code = "BASIC"
    }
}
