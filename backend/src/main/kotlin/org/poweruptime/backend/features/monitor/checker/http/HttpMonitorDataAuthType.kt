package org.poweruptime.backend.features.monitor.checker.http

import org.poweruptime.backend.core.models.ADatabaseEnumConvertable

enum class HttpMonitorDataAuthType : ADatabaseEnumConvertable {
    BASIC {
        override val code = "BASIC"
    }
}
