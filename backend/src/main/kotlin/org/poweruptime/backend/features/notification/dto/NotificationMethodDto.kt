package org.poweruptime.backend.features.notification.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.notification.core.NotificationMethodTemplate
import org.poweruptime.backend.features.notification.core.NotificationMethodTemplateFeatures
import org.poweruptime.backend.features.notification.core.NotificationMethodTemplateType
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.model.NotificationMethod
import org.poweruptime.backend.features.notification.model.NotificationMethodData
import java.time.Instant

data class NotificationMethodMinResponse(
    val id: String,
    val name: String,
    val sender: NotificationMethodDataMinDto,
) {
    constructor(it: NotificationMethod) : this(
        id = it.id,
        name = it.name,
        sender = NotificationMethodDataMinDto(it.data),
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
    val sender: NotificationMethodData,
    val useByDefault: Boolean,
    val titleTemplate: String?,
    val bodyTemplate: String?,
) {
    constructor(it: NotificationMethod) : this(
        id = it.id,
        name = it.name,
        deleted = it.deleted,
        sender = it.data,
        useByDefault = it.useByDefault,
        titleTemplate = it.titleTemplate ?: it.data._type.titleTemplate,
        bodyTemplate = it.bodyTemplate ?: it.data._type.bodyTemplate,
    )
}

data class UpdateNotificationMethodDto(
    @get:NotBlank val id: String,
    @get:NotBlank @get:Size(min = Database.MIN_NAME_LENGTH, max = Database.MAX_NAME_LENGTH) val name: String,
    @get:NotNull val sender: NotificationMethodData,
    @get:NotNull val useByDefault: Boolean,
    val testSend: Boolean = false,
    val titleTemplate: String?,
    val bodyTemplate: String?,
)

data class CreateNotificationMethodDto(
    @get:NotBlank val teamId: String,
    @get:NotBlank @get:Size(min = Database.MIN_NAME_LENGTH, max = Database.MAX_NAME_LENGTH) val name: String,
    @get:NotNull val sender: NotificationMethodData,
    @get:NotNull val useByDefault: Boolean,
    val testSend: Boolean = false,
    val titleTemplate: String?,
    val bodyTemplate: String?,
)
