package org.poweruptime.backend.features.notification.notificationSenders.email

import jakarta.persistence.Column
import jakarta.persistence.DiscriminatorValue
import jakarta.persistence.Entity
import jakarta.validation.constraints.*
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.mail.EmailSender
import org.poweruptime.backend.features.notification.core.NotificationSenderData
import org.poweruptime.backend.features.notification.core.NotificationSenderType
import org.poweruptime.backend.features.notification.core.NotificationSenderTypes

@Entity
@DiscriminatorValue(NotificationSenderTypes.EMAIL)
class EmailNotificationSenderData(
    @Column(name = "mail_to", length = Database.MAX_MAIL_LENGTH)
    @get:NotBlank
    @get:Size(
        min = Database.MIN_MAIL_LENGTH,
        max = Database.MAX_MAIL_LENGTH,
    )
    val to: String,

    @Column(name = "mail_host", length = Database.MAX_DOMAIN_LENGTH)
    @get:NotBlank
    @get:Size(
        min = Database.MIN_DOMAIN_LENGTH,
        max = Database.MAX_DOMAIN_LENGTH,
    )
    @get:Pattern(regexp = Database.DOMAIN_REGEX)
    override val host: String,

    @Column(name = "mail_port")
    @get:NotNull
    @get:Min(Database.MIN_PORT)
    @get:Max(Database.MAX_PORT)
    override val port: Int,

    @Column(name = "mail_username", length = Database.MAX_BASIC_AUTH_LENGTH)
    @get:NotBlank
    @get:Size(max = Database.MAX_BASIC_AUTH_LENGTH)
    override val username: String,

    @Column(name = "mail_password", length = Database.MAX_BASIC_AUTH_LENGTH)
    @get:NotBlank
    @get:Size(max = Database.MAX_BASIC_AUTH_LENGTH)
    override val password: String

) : NotificationSenderData(NotificationSenderType.EMAIL), EmailSender {
    // ObjectMapper needs an empty constructor
    @Suppress("unused")
    constructor() : this(
        "",
        "",
        1234,
        "",
        "",
    )
}
