package org.poweruptime.backend.features.notification.notificationSenders.discord

import jakarta.persistence.Column
import jakarta.persistence.DiscriminatorValue
import jakarta.persistence.Entity
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.notification.core.NotificationSenderData
import org.poweruptime.backend.features.notification.core.NotificationSenderType
import org.poweruptime.backend.features.notification.core.NotificationSenderTypes

@Entity
@DiscriminatorValue(NotificationSenderTypes.DISCORD)
class DiscordNotificationSenderData(
    @Column(name = "discord_url", length = Database.MAX_URL_LENGTH)
    @get:NotBlank
    @get:Size(min = Database.MIN_URL_LENGTH, max = Database.MAX_URL_LENGTH)
    @get:Pattern(regexp = Database.URL_REGEX)
    val url: String,

    @Column(name = "discord_display_name", length = Database.MAX_DISCORD_DISPLAY_NAME_LENGTH)
    @get:Size(min = Database.MIN_DISCORD_DISPLAY_NAME_LENGTH, max = Database.MAX_DISCORD_DISPLAY_NAME_LENGTH)
    val displayName: String? = null,
) : NotificationSenderData(NotificationSenderType.DISCORD) {
    // ObjectMapper needs an empty constructor
    @Suppress("unused")
    constructor() : this("", null)
}
