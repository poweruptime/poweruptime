package org.poweruptime.backend.features.notification.notificationMethods.discord

import jakarta.persistence.Column
import jakarta.persistence.DiscriminatorValue
import jakarta.persistence.Entity
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.core.NotificationMethodTypes
import org.poweruptime.backend.features.notification.model.NOTIFICATION_METHOD_DATA_TABLE_NAME
import org.poweruptime.backend.features.notification.model.NotificationMethodData

private const val TYPE = NotificationMethodTypes.DISCORD

@Entity(name = "${NOTIFICATION_METHOD_DATA_TABLE_NAME}_$TYPE")
@DiscriminatorValue(TYPE)
class DiscordNotificationMethodData(
    @Column(name = "discord_url", length = Database.MAX_URL_LENGTH)
    @get:NotBlank
    @get:Size(min = Database.MIN_URL_LENGTH, max = Database.MAX_URL_LENGTH)
    @get:Pattern(regexp = Database.URL_REGEX)
    val url: String,

    @Column(name = "discord_display_name", length = Database.MAX_DISCORD_DISPLAY_NAME_LENGTH)
    @get:Size(min = Database.MIN_DISCORD_DISPLAY_NAME_LENGTH, max = Database.MAX_DISCORD_DISPLAY_NAME_LENGTH)
    val displayName: String? = null,
) : NotificationMethodData(NotificationMethodType.DISCORD) {
    // ObjectMapper needs an empty constructor
    constructor() : this("", null)

    override fun clone() = DiscordNotificationMethodData(url)
}
