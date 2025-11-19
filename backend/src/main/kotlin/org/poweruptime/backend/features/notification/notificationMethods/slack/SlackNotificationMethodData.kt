package org.poweruptime.backend.features.notification.notificationMethods.slack

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.core.NotificationMethodTypes
import org.poweruptime.backend.features.notification.model.NotificationMethodData
import org.poweruptime.backend.features.notification.model.NotificationMethodDataTable

object SlackNotificationMethodData : NotificationMethodDataTable(NotificationMethodType.SLACK) {
    val url = varchar("slack_url", Database.MAX_URL_LENGTH)
    val displayName = varchar("slack_display_name", Database.MAX_DISCORD_DISPLAY_NAME_LENGTH).nullable()

    override fun rowToRecord(row: ResultRow): SlackNotificationMethodDataRecord = SlackNotificationMethodDataRecord(
        url = row[url],
        displayName = row[displayName],
    )

    override fun insert(
        notificationMethodId: ULong,
        data: NotificationMethodData
    ) {
        data as SlackNotificationMethodDataRecord

        insert {
            it[id] = notificationMethodId
            it[url] = data.url
            it[displayName] = data.displayName
        }
    }

    override fun update(
        notificationMethodId: ULong,
        data: NotificationMethodData
    ) {
        data as SlackNotificationMethodDataRecord

        update({ id eq notificationMethodId }) {
            it[url] = data.url
            it[displayName] = data.displayName
        }
    }

    init {
        registerTable(this)
    }
}

data class SlackNotificationMethodDataRecord(
    @get:NotBlank
    @get:Size(min = Database.MIN_URL_LENGTH, max = Database.MAX_URL_LENGTH)
    @get:Pattern(regexp = Database.URL_REGEX)
    val url: String,

    @get:Size(min = Database.MIN_DISCORD_DISPLAY_NAME_LENGTH, max = Database.MAX_DISCORD_DISPLAY_NAME_LENGTH)
    val displayName: String? = null,
) : NotificationMethodData(NotificationMethodType.SLACK) {
    companion object {
        init {
            registerDataRecord(NotificationMethodTypes.SLACK, SlackNotificationMethodDataRecord::class)
        }
    }
}
