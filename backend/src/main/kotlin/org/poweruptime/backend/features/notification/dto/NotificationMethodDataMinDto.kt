package org.poweruptime.backend.features.notification.dto

import com.fasterxml.jackson.annotation.JsonProperty
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.model.NotificationMethodData

data class NotificationMethodDataMinDto(
    @JsonProperty("_type")
    @Suppress("ConstructorParameterNaming")
    val _type: NotificationMethodType
) {
    constructor(it: NotificationMethodData) : this(it._type)
}
