package org.poweruptime.backend.features.monitor.model

import org.poweruptime.backend.core.models.ADatabaseEnumConvertable

object MonitorDataTypes {
    const val DNS = "DNS"
    const val HTTP = "HTTP"
    const val PING = "PING"
    const val PUSH = "PUSH"
    const val SSL_CERTIFICATE = "SSL_CERTIFICATE"
}

enum class MonitorType : ADatabaseEnumConvertable {
    DNS {
        override val code = MonitorDataTypes.DNS
    },
    HTTP {
        override val code = MonitorDataTypes.HTTP
    },
    PING {
        override val code = MonitorDataTypes.PING
    },
    PUSH {
        override val code = MonitorDataTypes.PUSH
    },
    SSL_CERTIFICATE {
        override val code = MonitorDataTypes.SSL_CERTIFICATE
    },
}
