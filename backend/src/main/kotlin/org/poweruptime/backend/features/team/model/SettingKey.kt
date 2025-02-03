package org.poweruptime.backend.features.team.model

import jakarta.persistence.Converter
import org.poweruptime.backend.core.models.ADatabaseEnumConvertable
import org.poweruptime.backend.core.models.ADatabaseEnumConverter

enum class SettingKey : ADatabaseEnumConvertable {
    TIMEZONE {
        override val code = "T"
    },
    USERS_ALLOWED_TO_CREATE_TEAMS {
        override val code = "UA"
    },
    CHECK_RESULT_RETENTION_PERIOD_IN_DAYS {
        override val code = "CR"
    },
    CHECK_RESULT_LOG_RETENTION_PERIOD_IN_DAYS {
        override val code = "LR"
    }
}

@Converter(autoApply = true)
class SettingKeyDatabaseConverter : ADatabaseEnumConverter<SettingKey>() {
    override fun getKeys(): Array<SettingKey> = SettingKey.entries.toTypedArray()
}
