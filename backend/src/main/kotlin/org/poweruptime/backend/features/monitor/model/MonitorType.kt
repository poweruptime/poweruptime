package org.poweruptime.backend.features.monitor.model

import org.poweruptime.backend.core.models.ADatabaseEnumConvertable

object MonitorTypes {
    const val DNS = "DNS"
    const val HTTP = "HTTP"
    const val PING = "PING"
    const val PUSH = "PUSH"
    const val SSL_CERTIFICATE = "SSL_CERTIFICATE"
}

enum class MonitorType : ADatabaseEnumConvertable {
    DNS {
        override val code = MonitorTypes.DNS
    },
    HTTP {
        override val code = MonitorTypes.HTTP
    },
    PING {
        override val code = MonitorTypes.PING
    },
    PUSH {
        override val code = MonitorTypes.PUSH
    },
    SSL_CERTIFICATE {
        override val code = MonitorTypes.SSL_CERTIFICATE
    },
}
