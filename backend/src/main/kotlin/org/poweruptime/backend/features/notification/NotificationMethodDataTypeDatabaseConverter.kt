package org.poweruptime.backend.features.notification

import jakarta.persistence.Converter
import org.poweruptime.backend.core.models.ADatabaseEnumConverter
import org.poweruptime.backend.features.notification.core.NotificationMethodType

@Converter(autoApply = true)
class NotificationMethodDataTypeDatabaseConverter : ADatabaseEnumConverter<NotificationMethodType>() {
    override fun getKeys(): Array<NotificationMethodType> = NotificationMethodType.entries.toTypedArray()
}
