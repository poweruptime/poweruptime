package org.poweruptime.backend.features.monitor.checker.http

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
    }
}

const val MAX_HTTP_MONITOR_DATA_CONTENT_TYPE_LENGTH = 4
