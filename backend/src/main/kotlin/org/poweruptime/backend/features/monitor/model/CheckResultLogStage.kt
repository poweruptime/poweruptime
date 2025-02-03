package org.poweruptime.backend.features.monitor.model

import jakarta.persistence.Converter
import org.poweruptime.backend.core.models.ADatabaseEnumConvertable
import org.poweruptime.backend.core.models.ADatabaseEnumConverter

const val CHECK_RESULT_LOG_STAGE_SETUP = "S"
const val CHECK_RESULT_LOG_STAGE_CHECK = "C"
const val CHECK_RESULT_LOG_STAGE_MONITOR_STATUS_UPDATE = "M"
const val CHECK_RESULT_LOG_STAGE_NOTIFICATION = "N"

enum class CheckResultLogStage : ADatabaseEnumConvertable {
    SETUP {
        override val code = CHECK_RESULT_LOG_STAGE_SETUP
    },
    CHECK {
        override val code = CHECK_RESULT_LOG_STAGE_CHECK
    },
    MONITOR_STATUS_UPDATE {
        override val code = CHECK_RESULT_LOG_STAGE_MONITOR_STATUS_UPDATE
    },
    NOTIFICATION {
        override val code = CHECK_RESULT_LOG_STAGE_NOTIFICATION
    },
}

@Converter(autoApply = true)
class CheckResultLogStageDatabaseConverter : ADatabaseEnumConverter<CheckResultLogStage>() {
    override fun getKeys(): Array<CheckResultLogStage> = CheckResultLogStage.entries.toTypedArray()
}
