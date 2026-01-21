package org.poweruptime.backend.features.monitor.checkers.http

import org.poweruptime.backend.core.models.ADatabaseEnumConvertable

enum class HttpMonitorDataContentType : ADatabaseEnumConvertable {
    JSON {
        override val code = "JSON"
    },
    XML {
        override val code = "XML"
    },
    HTML {
        override val code = "HTML"
    },
}
