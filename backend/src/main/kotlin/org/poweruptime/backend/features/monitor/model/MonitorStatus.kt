package org.poweruptime.backend.features.monitor.model

import jakarta.persistence.Converter
import org.poweruptime.backend.core.models.ADatabaseEnumConvertable
import org.poweruptime.backend.core.models.ADatabaseEnumConverter

const val MONITOR_STATUS_UP = "U"
const val MONITOR_STATUS_DOWN = "D"
const val MONITOR_STATUS_PENDING = "P"
const val MONITOR_STATUS_MAINTENANCE = "M"
const val MONITOR_STATUS_PAUSED = "R"

enum class MonitorStatus : ADatabaseEnumConvertable, MonitorStatusColor {
    UP {
        override val code = MONITOR_STATUS_UP
        override val color = "#22C45D"
    },
    DOWN {
        override val code = MONITOR_STATUS_DOWN
        override val color = "#EE4343"
    },
    PENDING {
        override val code = MONITOR_STATUS_PENDING
        override val color = "#3A81F5"
    },
    MAINTENANCE {
        override val code = MONITOR_STATUS_MAINTENANCE
        override val color = "#3A81F5"
    },
    PAUSED {
        override val code = MONITOR_STATUS_PAUSED
        override val color = "#3A81F5"
    },
}

@Converter(autoApply = true)
class MonitorStatusDatabaseConverter : ADatabaseEnumConverter<MonitorStatus>() {
    override fun getKeys(): Array<MonitorStatus> = MonitorStatus.entries.toTypedArray()
}

interface MonitorStatusColor {
    val color: String
}
