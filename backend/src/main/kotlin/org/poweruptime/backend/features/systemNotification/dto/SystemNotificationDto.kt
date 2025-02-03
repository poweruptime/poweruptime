package org.poweruptime.backend.features.systemNotification.dto

import com.fasterxml.jackson.annotation.JsonFormat
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import org.poweruptime.backend.core.utils.DateTimeUtils
import org.poweruptime.backend.features.systemNotification.model.SystemNotification
import org.poweruptime.backend.features.systemNotification.model.SystemNotificationType
import java.time.Instant

data class SystemNotificationResponse(
    val id: String,
    val title: String?,
    val description: String,
    val active: Boolean,
    val type: SystemNotificationType,
    @get:JsonFormat(pattern = DateTimeUtils.FORMAT, timezone = "UTC") val starts: Instant?,
    @get:JsonFormat(pattern = DateTimeUtils.FORMAT, timezone = "UTC") val ends: Instant?
) {
    constructor(it: SystemNotification) : this(
        it.id,
        it.title,
        it.description,
        it.active,
        it.type,
        it.starts,
        it.ends,
    )
}

data class CreateSystemNotificationDto(
    @get:Size(min = 1, max = 100) val title: String?,
    @get:Size(min = 1, max = 2000) val description: String,
    val active: Boolean = true,
    @get:NotNull val type: SystemNotificationType,
    @get:JsonFormat(pattern = DateTimeUtils.FORMAT, timezone = "UTC") val starts: Instant?,
    @get:JsonFormat(pattern = DateTimeUtils.FORMAT, timezone = "UTC") val ends: Instant?,
)

data class UpdateSystemNotificationDto(
    @get:NotNull val id: String,
    @get:Size(min = 1, max = 100) val title: String?,
    @get:Size(min = 1, max = 2000) val description: String,
    val active: Boolean = true,
    @get:NotNull val type: SystemNotificationType,
    @get:JsonFormat(pattern = DateTimeUtils.FORMAT, timezone = "UTC") val starts: Instant?,
    @get:JsonFormat(pattern = DateTimeUtils.FORMAT, timezone = "UTC") val ends: Instant?,
)
