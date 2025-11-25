package org.poweruptime.backend.features.monitor.model

import org.poweruptime.backend.core.models.ADatabaseEnumConvertable

enum class CheckResultLogStage : ADatabaseEnumConvertable {
    SETUP {
        override val code = "S"
    },
    CHECK {
        override val code = "C"
    },
    MONITOR_STATUS_UPDATE {
        override val code = "M"
    },
    NOTIFICATION {
        override val code = "N"
    },
}
