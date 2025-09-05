package org.poweruptime.backend.features.notification.notificationMethods.discord

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.jetbrains.exposed.v1.core.ResultRow
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.model.NotificationMethodData
import org.poweruptime.backend.features.notification.model.NotificationMethodDataTable

object DiscordNotificationMethodDataTable : NotificationMethodDataTable(NotificationMethodType.DISCORD) {
    val url = varchar("discord_url", Database.MAX_URL_LENGTH)
    val displayName = varchar("discord_display_name", Database.MAX_DISCORD_DISPLAY_NAME_LENGTH).nullable()

    override fun rowToRecord(row: ResultRow): DiscordNotificationMethodDataRecord = DiscordNotificationMethodDataRecord(
        url = row[url],
        displayName = row[displayName],
    )
}

data class DiscordNotificationMethodDataRecord(
    @get:NotBlank
    @get:Size(min = Database.MIN_URL_LENGTH, max = Database.MAX_URL_LENGTH)
    @get:Pattern(regexp = Database.URL_REGEX)
    val url: String,
    @get:Size(min = Database.MIN_DISCORD_DISPLAY_NAME_LENGTH, max = Database.MAX_DISCORD_DISPLAY_NAME_LENGTH)
    val displayName: String?,
) : NotificationMethodData(NotificationMethodType.DISCORD)
