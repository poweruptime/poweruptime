package org.poweruptime.backend.features.notification.notificationMethods.apprise

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

object AppriseNotificationMethodData : NotificationMethodDataTable(NotificationMethodType.APPRISE) {
    val url = varchar("apprise_url", Database.MAX_URL_LENGTH)

    override fun rowToRecord(row: ResultRow): AppriseNotificationMethodDataRecord = AppriseNotificationMethodDataRecord(
        url = row[url],
    )

    override fun insert(
        notificationMethodId: ULong,
        data: NotificationMethodData
    ) {
        data as AppriseNotificationMethodDataRecord

        insert {
            it[id] = notificationMethodId
            it[url] = data.url
        }
    }

    override fun update(
        notificationMethodId: ULong,
        data: NotificationMethodData
    ) {
        data as AppriseNotificationMethodDataRecord

        update({ id eq notificationMethodId }) {
            it[url] = data.url
        }
    }

    init {
        registerTable(this)
    }
}

data class AppriseNotificationMethodDataRecord(
    @get:NotBlank
    @get:Size(min = Database.MIN_URL_LENGTH, max = Database.MAX_URL_LENGTH)
    @get:Pattern(regexp = Database.URL_REGEX)
    val url: String,
) : NotificationMethodData(NotificationMethodType.APPRISE) {
    companion object {
        init {
            registerDataRecord(NotificationMethodTypes.APPRISE, AppriseNotificationMethodDataRecord::class)
        }
    }
}
