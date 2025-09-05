package org.poweruptime.backend.features.notification.model

import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.databind.annotation.JsonTypeIdResolver
import org.poweruptime.backend.features.notification.core.NotificationMethodDataTypeResolver
import org.poweruptime.backend.features.notification.core.NotificationMethodType

@JsonTypeInfo(use = JsonTypeInfo.Id.CLASS, include = JsonTypeInfo.As.EXTERNAL_PROPERTY, property = "_type")
@JsonTypeIdResolver(NotificationMethodDataTypeResolver::class)
abstract class NotificationMethodData(
    @Suppress("PropertyName", "ConstructorParameterNaming")
    @JsonProperty("_type")
    val _type: NotificationMethodType
)
