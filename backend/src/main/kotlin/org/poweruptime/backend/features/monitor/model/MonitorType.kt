package org.poweruptime.backend.features.monitor.model

import org.poweruptime.backend.core.models.ADatabaseEnumConvertable

enum class MonitorType : ADatabaseEnumConvertable {
    DNS {
        override val code = "DNS"
    },
    HTTP {
        override val code = "HTTP"
    },
    PING {
        override val code = "PING"
    },
    PUSH {
        override val code = "PUSH"
    },
    SSL_CERTIFICATE {
        override val code = "SSL_CERTIFICATE"
    },
}
