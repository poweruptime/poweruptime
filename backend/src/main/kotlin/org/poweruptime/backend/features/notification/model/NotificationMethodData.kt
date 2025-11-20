package org.poweruptime.backend.features.notification.model

import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.databind.annotation.JsonTypeIdResolver
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.features.notification.core.NotificationMethodDataTypeResolver
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.core.NotificationMethodTypes
import org.poweruptime.backend.features.notification.notificationMethods.apprise.AppriseNotificationMethodDataRecord
import org.poweruptime.backend.features.notification.notificationMethods.discord.DiscordNotificationMethodDataRecord
import org.poweruptime.backend.features.notification.notificationMethods.email.EmailNotificationMethodDataRecord
import org.poweruptime.backend.features.notification.notificationMethods.slack.SlackNotificationMethodDataRecord
import kotlin.reflect.KClass

@JsonTypeInfo(use = JsonTypeInfo.Id.CLASS, include = JsonTypeInfo.As.PROPERTY, property = "_type")
@JsonTypeIdResolver(NotificationMethodDataTypeResolver::class)
abstract class NotificationMethodData(
    @Suppress("PropertyName", "ConstructorParameterNaming")
    @JsonProperty("_type")
    val _type: NotificationMethodType
) {
    companion object {
        private val registry = mutableMapOf<String, KClass<out NotificationMethodData>>()

        private fun registerDataRecord(type: String, clazz: KClass<out NotificationMethodData>) {
            registry[type] = clazz
        }

        fun forType(type: String): KClass<out NotificationMethodData> =
            registry[type] ?: throw BadRequestException("Unknown notification method type: $type")

        fun forClass(klass: KClass<*>?): String =
            registry.entries.find { it.value == klass }?.key
                ?: throw BadRequestException("Unknown notification method class: ${klass?.simpleName ?: "null"}")

        init {
            registerDataRecord(NotificationMethodTypes.APPRISE, AppriseNotificationMethodDataRecord::class)
            registerDataRecord(NotificationMethodTypes.DISCORD, DiscordNotificationMethodDataRecord::class)
            registerDataRecord(NotificationMethodTypes.EMAIL, EmailNotificationMethodDataRecord::class)
            registerDataRecord(NotificationMethodTypes.SLACK, SlackNotificationMethodDataRecord::class)
        }
    }
}
