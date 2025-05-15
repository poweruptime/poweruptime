package org.poweruptime.backend.features.notification.dto

import com.fasterxml.jackson.annotation.JsonProperty
import org.poweruptime.backend.features.notification.core.NotificationMethodData
import org.poweruptime.backend.features.notification.core.NotificationMethodDataType

data class NotificationMethodDataMinDto(
    @JsonProperty("_type")
    @Suppress("ConstructorParameterNaming")
    val _type: NotificationMethodDataType
) {
    constructor(it: NotificationMethodData) : this(it._type)
}
