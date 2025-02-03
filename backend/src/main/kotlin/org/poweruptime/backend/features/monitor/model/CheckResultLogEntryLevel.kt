package org.poweruptime.backend.features.monitor.model

import jakarta.persistence.Converter
import org.poweruptime.backend.core.models.ADatabaseEnumConvertable
import org.poweruptime.backend.core.models.ADatabaseEnumConverter

const val CHECK_RESULT_LOG_ENTRY_LEVEL_INFO = "I"
const val CHECK_RESULT_LOG_ENTRY_LEVEL_ACTION = "A"

enum class CheckResultLogEntryLevel : ADatabaseEnumConvertable {
    INFO {
        override val code = CHECK_RESULT_LOG_ENTRY_LEVEL_INFO
    },
    ACTION {
        override val code = CHECK_RESULT_LOG_ENTRY_LEVEL_ACTION
    },
}

@Converter(autoApply = true)
class CheckResultLogEntryLevelDatabaseConverter : ADatabaseEnumConverter<CheckResultLogEntryLevel>() {
    override fun getKeys(): Array<CheckResultLogEntryLevel> = CheckResultLogEntryLevel.entries.toTypedArray()
}
