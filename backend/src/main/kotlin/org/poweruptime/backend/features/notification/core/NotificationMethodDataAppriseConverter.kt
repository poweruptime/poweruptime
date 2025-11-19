package org.poweruptime.backend.features.notification.core

import org.poweruptime.backend.features.notification.model.NotificationMethodData
import org.poweruptime.backend.features.notification.notificationMethods.apprise.AppriseNotificationMethodDataAppriseConverter
import org.poweruptime.backend.features.notification.notificationMethods.discord.DiscordNotificationMethodDataAppriseConverter
import org.poweruptime.backend.features.notification.notificationMethods.email.EmailNotificationMethodDataAppriseConverter
import org.poweruptime.backend.features.notification.notificationMethods.slack.SlackNotificationMethodDataAppriseConverter

abstract class NotificationMethodDataAppriseConverter(val type: NotificationMethodType) {
    abstract fun convert(notificationMethodData: NotificationMethodData): NotificationMethodDataAppriseDto

    companion object {
        private val registry = mutableMapOf<NotificationMethodType, NotificationMethodDataAppriseConverter>()

        private fun registerConverter(converter: NotificationMethodDataAppriseConverter) {
            registry[converter.type] = converter
        }

        fun getByType(type: NotificationMethodType): NotificationMethodDataAppriseConverter =
            registry[type] ?: error("Unknown monitor type: $type")

        init {
            registerConverter(AppriseNotificationMethodDataAppriseConverter())
            registerConverter(DiscordNotificationMethodDataAppriseConverter())
            registerConverter(EmailNotificationMethodDataAppriseConverter())
            registerConverter(SlackNotificationMethodDataAppriseConverter())
        }
    }
}
