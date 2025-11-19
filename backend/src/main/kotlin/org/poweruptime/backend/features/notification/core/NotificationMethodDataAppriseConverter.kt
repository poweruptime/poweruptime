package org.poweruptime.backend.features.notification.core

import org.poweruptime.backend.features.notification.model.NotificationMethodData

abstract class NotificationMethodDataAppriseConverter(val type: NotificationMethodType) {
    abstract fun convert(notificationMethodData: NotificationMethodData): NotificationMethodDataAppriseDto

    companion object {
        private val registry = mutableMapOf<NotificationMethodType, NotificationMethodDataAppriseConverter>()

        fun registerConverter(converter: NotificationMethodDataAppriseConverter) {
            registry[converter.type] = converter
        }

        fun getByType(type: NotificationMethodType): NotificationMethodDataAppriseConverter =
            registry[type] ?: error("Unknown monitor type: $type")
    }
}
