package org.poweruptime.backend.features.monitor.checkers.http

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
    },
}
