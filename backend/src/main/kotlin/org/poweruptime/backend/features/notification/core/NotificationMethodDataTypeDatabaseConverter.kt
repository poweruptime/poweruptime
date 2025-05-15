package org.poweruptime.backend.features.notification.core

import jakarta.persistence.Converter
import org.poweruptime.backend.core.models.ADatabaseEnumConverter

@Converter(autoApply = true)
class NotificationMethodDataTypeDatabaseConverter : ADatabaseEnumConverter<NotificationMethodDataType>() {
    override fun getKeys(): Array<NotificationMethodDataType> = NotificationMethodDataType.entries.toTypedArray()
}
