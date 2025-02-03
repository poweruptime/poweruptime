package org.poweruptime.backend.features.notification.core

import jakarta.persistence.Converter
import org.poweruptime.backend.core.models.ADatabaseEnumConverter

@Converter(autoApply = true)
class NotificationSenderTypeDatabaseConverter : ADatabaseEnumConverter<NotificationSenderType>() {
    override fun getKeys(): Array<NotificationSenderType> = NotificationSenderType.entries.toTypedArray()
}
