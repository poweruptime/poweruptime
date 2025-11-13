package org.poweruptime.backend.features.notification.model

import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.databind.annotation.JsonTypeIdResolver
import org.poweruptime.backend.features.notification.core.NotificationMethodDataTypeResolver
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import kotlin.reflect.KClass

@JsonTypeInfo(use = JsonTypeInfo.Id.CLASS, include = JsonTypeInfo.As.EXTERNAL_PROPERTY, property = "_type")
@JsonTypeIdResolver(NotificationMethodDataTypeResolver::class)
abstract class NotificationMethodData(
    @Suppress("PropertyName", "ConstructorParameterNaming")
    @JsonProperty("_type")
    val _type: NotificationMethodType
) {
    companion object {
        private val registry = mutableMapOf<String, KClass<out NotificationMethodData>>()

        fun registerDataRecord(type: String, clazz: KClass<out NotificationMethodData>) {
            registry[type] = clazz
        }

        fun forType(type: String): KClass<out NotificationMethodData> =
            registry[type] ?: error("Unknown notification method type: $type")

        fun forClass(klass: KClass<*>?): String =
            registry.entries.find { it.value == klass }?.key
                ?: error("Unknown notification method class: ${klass?.simpleName ?: "null"}")
    }
}
