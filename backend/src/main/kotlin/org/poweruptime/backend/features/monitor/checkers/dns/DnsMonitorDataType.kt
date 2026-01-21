package org.poweruptime.backend.features.monitor.checkers.dns

import org.poweruptime.backend.core.models.ADatabaseEnumConvertable

enum class DnsMonitorDataType : ADatabaseEnumConvertable {
    A {
        override val code = "A"
    },
    AAAA {
        override val code = "AAAA"
    },
    CAA {
        override val code = "CAA"
    },
    CNAME {
        override val code = "CNAME"
    },
    MX {
        override val code = "MX"
    },
    NS {
        override val code = "NS"
    },
    PTR {
        override val code = "PTR"
    },
    SOA {
        override val code = "SOA"
    },
    SRV {
        override val code = "SRV"
    },
    TXT {
        override val code = "TXT"
    },
}
