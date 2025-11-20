package org.poweruptime.backend.features.monitor.model

import org.poweruptime.backend.core.models.ADatabaseEnumConvertable

enum class CheckResultLogEntryLevel : ADatabaseEnumConvertable {
    INFO {
        override val code = "I"
    },
    ACTION {
        override val code = "A"
    },
}
