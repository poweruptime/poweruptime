package org.poweruptime.backend.features.team.model

import jakarta.persistence.Converter
import org.poweruptime.backend.core.models.ADatabaseEnumConvertable
import org.poweruptime.backend.core.models.ADatabaseEnumConverter
import java.time.ZoneId

enum class SettingKey : ADatabaseEnumConvertable, SettingKeyDefaultValue {
    CHECK_RESULT_RETENTION_PERIOD_IN_DAYS {
        override val code = "CR"
        override val default = 365.toString() // 1 year
    },
    CHECK_RESULT_LOG_RETENTION_PERIOD_IN_DAYS {
        override val code = "LR"
        override val default = 182.toString() // 6 months
    },
    SERVER_SETUP_TIME {
        override val code = "ST"
        override val default = "null"
    },
    SUPPORT_LOOKUP {
        override val code = "SL"
        override val default = "null"
    },
    SUPPORTS_SINCE {
        override val code = "SD"
        override val default = "null"
    },
    SHOW_SUPPORT_BADGE {
        override val code = "SB"
        override val default = true.toString()
    },
    TIMEZONE {
        override val code = "T"
        override val default: String = ZoneId.systemDefault().id
    },
    USERS_ALLOWED_TO_CREATE_TEAMS {
        override val code = "UA"
        override val default = false.toString()
    },
    VERSION_CHECK_ENABLED {
        override val code = "VC"
        override val default: String = false.toString()
    },
    VERSION_CHECK_ADMIN_MAIL_ENABLED {
        override val code = "VM"
        override val default: String = false.toString()
    },
}

@Converter(autoApply = true)
class SettingKeyDatabaseConverter : ADatabaseEnumConverter<SettingKey>() {
    override fun getKeys(): Array<SettingKey> = SettingKey.entries.toTypedArray()
}

interface SettingKeyDefaultValue {
    val default: String
}
