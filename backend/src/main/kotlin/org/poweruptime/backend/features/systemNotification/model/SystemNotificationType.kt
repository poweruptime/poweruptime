package org.poweruptime.backend.features.systemNotification.model

import jakarta.persistence.Converter
import org.poweruptime.backend.core.models.ADatabaseEnumConvertable
import org.poweruptime.backend.core.models.ADatabaseEnumConverter

enum class SystemNotificationType : ADatabaseEnumConvertable {
    INFO {
        override val code = "I"
    },
    WARNING {
        override val code = "W"
    },
    DANGER {
        override val code = "D"
    },
    SUCCESS {
        override val code = "S"
    },
    NEUTRAL {
        override val code = "N"
    }
}

@Converter(autoApply = true)
class SystemNotificationTypeDatabaseConverter : ADatabaseEnumConverter<SystemNotificationType>() {
    override fun getKeys(): Array<SystemNotificationType> = SystemNotificationType.entries.toTypedArray()
}
