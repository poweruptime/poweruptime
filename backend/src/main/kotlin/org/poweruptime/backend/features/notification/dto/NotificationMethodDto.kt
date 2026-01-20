package org.poweruptime.backend.features.notification.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.monitor.dto.MonitorMinResponse
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.notification.core.NotificationMethodTemplate
import org.poweruptime.backend.features.notification.core.NotificationMethodTemplateFeatures
import org.poweruptime.backend.features.notification.core.NotificationMethodTemplateType
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.model.NotificationMethodData
import org.poweruptime.backend.features.notification.model.NotificationMethodRecord
import java.time.Instant

data class NotificationMethodMinResponse(val id: String, val name: String, val type: NotificationMethodType) {
    constructor(it: NotificationMethodRecord) : this(
        id = it.publicId,
        name = it.name,
        type = it.type,
    )
}

data class NotificationMethodTemplateResponse(
    val type: NotificationMethodType,
    override val titleTemplate: String,
    override val bodyTemplate: String,
    override val bodyType: NotificationMethodTemplateType,
    override val features: List<NotificationMethodTemplateFeatures>?,
) : NotificationMethodTemplate {
    constructor(it: NotificationMethodType) : this(
        type = it,
        titleTemplate = it.titleTemplate,
        bodyTemplate = it.bodyTemplate,
        bodyType = it.bodyType,
        features = it.features,
    )
}

data class NotificationMethodResponse(
    val id: String,
    val name: String,
    val deleted: Instant?,
    val type: NotificationMethodType,
    val data: NotificationMethodData,
    val useByDefault: Boolean,
    val titleTemplate: String?,
    val bodyTemplate: String?,
    val monitors: List<MonitorMinResponse>,
) {
    constructor(
        notificationMethod: NotificationMethodRecord,
        data: NotificationMethodData,
        usedByMonitors: List<MonitorRecord>,
    ) : this(
        id = notificationMethod.publicId,
        name = notificationMethod.name,
        deleted = notificationMethod.deleted,
        type = notificationMethod.type,
        data = data,
        useByDefault = notificationMethod.useByDefault,
        titleTemplate = notificationMethod.titleTemplate ?: notificationMethod.type.titleTemplate,
        bodyTemplate = notificationMethod.bodyTemplate ?: notificationMethod.type.bodyTemplate,
        monitors = usedByMonitors.map { MonitorMinResponse(it) },
    )
}

data class UpdateNotificationMethodDto(
    @get:NotBlank val id: String,
    @get:NotBlank @get:Size(min = Database.MIN_NAME_LENGTH, max = Database.MAX_NAME_LENGTH) val name: String,
    @get:NotNull val data: NotificationMethodData,
    @get:NotNull val useByDefault: Boolean,
    @get:NotNull val monitorIds: List<String>,
    val testSend: Boolean = false,
    val titleTemplate: String?,
    val bodyTemplate: String?,
)

data class CreateNotificationMethodDto(
    @get:NotBlank val teamId: String,
    @get:NotBlank @get:Size(min = Database.MIN_NAME_LENGTH, max = Database.MAX_NAME_LENGTH) val name: String,
    @get:NotNull val data: NotificationMethodData,
    @get:NotNull val useByDefault: Boolean,
    @get:NotNull val monitorIds: List<String>,
    val testSend: Boolean = false,
    val titleTemplate: String?,
    val bodyTemplate: String?,
)
