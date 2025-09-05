package org.poweruptime.backend.features.monitor.checker.http

import org.poweruptime.backend.core.models.ADatabaseEnumConvertable

enum class HttpMonitorDataMethod : ADatabaseEnumConvertable {
    GET {
        override val code = "GET"
    },
    POST {
        override val code = "POST"
    },
    PUT {
        override val code = "PUT"
    },
    PATCH {
        override val code = "PATCH"
    },
    DELETE {
        override val code = "DELETE"
    },
    HEAD {
        override val code = "HEAD"
    },
    OPTIONS {
        override val code = "OPTIONS"
    }
}

const val MAX_HTTP_MONITOR_DATA_METHOD_LENGTH = 7
