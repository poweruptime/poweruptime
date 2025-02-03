package org.poweruptime.backend.features.monitor.core

import org.poweruptime.backend.core.models.ADatabaseEnumConvertable

object MonitorCheckerTypes {
    const val DNS = "DNS"
    const val HTTP = "HTTP"
    const val PING = "PING"
    const val PUSH = "PUSH"
    const val SSL_CERTIFICATE = "SSL_CERTIFICATE"
}

enum class MonitorCheckerType : ADatabaseEnumConvertable {
    DNS {
        override val code = MonitorCheckerTypes.DNS
    },
    HTTP {
        override val code = MonitorCheckerTypes.HTTP
    },
    PING {
        override val code = MonitorCheckerTypes.PING
    },
    PUSH {
        override val code = MonitorCheckerTypes.PUSH
    },
    SSL_CERTIFICATE {
        override val code = MonitorCheckerTypes.SSL_CERTIFICATE
    },
}
