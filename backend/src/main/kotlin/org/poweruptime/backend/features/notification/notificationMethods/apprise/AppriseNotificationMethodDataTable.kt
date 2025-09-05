package org.poweruptime.backend.features.notification.notificationMethods.apprise

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.jetbrains.exposed.v1.core.ResultRow
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.model.NotificationMethodData
import org.poweruptime.backend.features.notification.model.NotificationMethodDataTable

object AppriseNotificationMethodDataTable : NotificationMethodDataTable(NotificationMethodType.APPRISE) {
    val url = varchar("apprise_url", Database.MAX_URL_LENGTH)

    override fun rowToRecord(row: ResultRow): AppriseNotificationMethodDataRecord = AppriseNotificationMethodDataRecord(
        url = row[url],
    )
}

data class AppriseNotificationMethodDataRecord(
    @get:NotBlank
    @get:Size(min = Database.MIN_URL_LENGTH, max = Database.MAX_URL_LENGTH)
    @get:Pattern(regexp = Database.URL_REGEX)
    val url: String,
) : NotificationMethodData(NotificationMethodType.APPRISE)
