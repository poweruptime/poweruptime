package org.poweruptime.backend.features.notification.converter

import jakarta.persistence.Converter
import org.poweruptime.backend.core.models.ADatabaseEnumConverter
import org.poweruptime.backend.features.notification.core.NotificationMethodDataType

@Converter(autoApply = true)
class NotificationMethodDataTypeDatabaseConverter : ADatabaseEnumConverter<NotificationMethodDataType>() {
    override fun getKeys(): Array<NotificationMethodDataType> = NotificationMethodDataType.entries.toTypedArray()
}
