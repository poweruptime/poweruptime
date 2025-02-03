package org.poweruptime.backend.features.notification.dto

import com.fasterxml.jackson.annotation.JsonProperty
import org.poweruptime.backend.features.notification.core.NotificationSenderData
import org.poweruptime.backend.features.notification.core.NotificationSenderType

data class NotificationSenderMinDto(
    @JsonProperty("_type")
    @Suppress("ConstructorParameterNaming")
    val _type: NotificationSenderType
) {
    constructor(it: NotificationSenderData) : this(it._type)
}
