package org.poweruptime.backend.features.monitor.model

import org.poweruptime.backend.core.models.ADatabaseEnumConvertable

const val MONITOR_STATUS_UP = "U"
const val MONITOR_STATUS_DOWN = "D"
const val MONITOR_STATUS_PENDING = "P"
const val MONITOR_STATUS_MAINTENANCE = "M"
const val MONITOR_STATUS_PAUSED = "R"

enum class MonitorStatus : ADatabaseEnumConvertable {
    UP {
        override val code = MONITOR_STATUS_UP
    },
    DOWN {
        override val code = MONITOR_STATUS_DOWN
    },
    PENDING {
        override val code = MONITOR_STATUS_PENDING
    },
    MAINTENANCE {
        override val code = MONITOR_STATUS_MAINTENANCE
    },
    PAUSED {
        override val code = MONITOR_STATUS_PAUSED
    },
}

const val MAX_MONITOR_STATUS_LENGTH = 1
