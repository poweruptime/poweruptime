package org.poweruptime.backend.features.notification.notificationMethods.discord

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.model.NotificationMethodData
import org.poweruptime.backend.features.notification.model.NotificationMethodDataTable

object DiscordNotificationMethodData : NotificationMethodDataTable(NotificationMethodType.DISCORD) {
    val url = varchar("discord_url", Database.MAX_URL_LENGTH)
    val displayName = varchar("discord_display_name", Database.MAX_DISCORD_DISPLAY_NAME_LENGTH).nullable()

    override fun rowToRecord(row: ResultRow): DiscordNotificationMethodDataRecord = DiscordNotificationMethodDataRecord(
        url = row[url],
        displayName = row[displayName],
    )

    override fun insert(notificationMethodId: ULong, data: NotificationMethodData) {
        data as DiscordNotificationMethodDataRecord

        insert {
            it[id] = notificationMethodId
            it[url] = data.url
            it[displayName] = data.displayName
        }
    }

    override fun update(notificationMethodId: ULong, data: NotificationMethodData) {
        data as DiscordNotificationMethodDataRecord

        update({ id eq notificationMethodId }) {
            it[url] = data.url
            it[displayName] = data.displayName
        }
    }

    init {
        registerTable(this)
    }
}

data class DiscordNotificationMethodDataRecord(
    @get:NotBlank
    @get:Size(min = Database.MIN_URL_LENGTH, max = Database.MAX_URL_LENGTH)
    @get:Pattern(regexp = Database.URL_REGEX)
    val url: String,
    @get:Size(min = Database.MIN_DISCORD_DISPLAY_NAME_LENGTH, max = Database.MAX_DISCORD_DISPLAY_NAME_LENGTH)
    val displayName: String?,
) : NotificationMethodData(NotificationMethodType.DISCORD)
