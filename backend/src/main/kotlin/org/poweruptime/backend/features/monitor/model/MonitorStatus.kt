package org.poweruptime.backend.features.monitor.model

import org.poweruptime.backend.core.models.ADatabaseEnumConvertable

enum class MonitorStatus : ADatabaseEnumConvertable {
    UP {
        override val code = "U"
    },
    DOWN {
        override val code = "D"
    },
    PENDING {
        override val code = "P"
    },
    MAINTENANCE {
        override val code = "M"
    },
    PAUSED {
        override val code = "R"
    },
}
