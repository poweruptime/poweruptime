package org.poweruptime.backend.features.notification.notificationMethods.apprise

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

private const val TYPE = NotificationMethodTypes.APPRISE

@Entity(name = "${NOTIFICATION_METHOD_DATA_TABLE_NAME}_$TYPE")
@DiscriminatorValue(TYPE)
class AppriseNotificationMethodData(
    @Column(name = "apprise_url", length = Database.MAX_URL_LENGTH, nullable = false)
    @get:NotBlank
    @get:Size(min = Database.MIN_URL_LENGTH, max = Database.MAX_URL_LENGTH)
    @get:Pattern(regexp = Database.URL_REGEX)
    val url: String,
) : NotificationMethodData(NotificationMethodType.APPRISE) {
    // ObjectMapper needs an empty constructor
    constructor() : this("")

    override fun clone() = AppriseNotificationMethodData(url)
}
