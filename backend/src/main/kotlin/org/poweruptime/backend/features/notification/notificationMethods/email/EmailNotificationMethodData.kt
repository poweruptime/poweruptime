package org.poweruptime.backend.features.notification.notificationMethods.email

import jakarta.persistence.Column
import jakarta.persistence.DiscriminatorValue
import jakarta.persistence.Entity
import jakarta.validation.constraints.*
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.mail.EmailSecurity
import org.poweruptime.backend.features.mail.EmailSender
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.core.NotificationMethodTypes
import org.poweruptime.backend.features.notification.model.NOTIFICATION_METHOD_DATA_TABLE_NAME
import org.poweruptime.backend.features.notification.model.NotificationMethodData

private const val TYPE = NotificationMethodTypes.EMAIL

@Entity(name = "${NOTIFICATION_METHOD_DATA_TABLE_NAME}_$TYPE")
@DiscriminatorValue(TYPE)
class EmailNotificationMethodData(
    @Suppress("JpaAttributeTypeInspection") @Column(
        name = "mail_to",
        nullable = false,
        columnDefinition = "text[]",
    )
    val to: Set<String>,

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
    override val password: String,

    /**
     * Usage of `EmailSecurityDatabaseConverter` to minify enum to 1 char
     * @see org.poweruptime.backend.features.mail.EmailSecurityDatabaseConverter
     */
    @Column(name = "mail_security", nullable = false, length = 1)
    @get:NotNull
    override val security: EmailSecurity,

    @Column(name = "mail_ignore_tls_errors", columnDefinition = "boolean")
    @get:NotNull
    override val ignoreTLSErrors: Boolean,

    @Suppress("JpaAttributeTypeInspection") @Column(
        name = "mail_cc",
        nullable = true,
        columnDefinition = "text[]",
    )
    val cc: Set<String>? = null,

    @Suppress("JpaAttributeTypeInspection") @Column(
        name = "mail_bcc",
        nullable = true,
        columnDefinition = "text[]",
    )
    val bcc: Set<String>? = null,
) : NotificationMethodData(NotificationMethodType.EMAIL), EmailSender {
    // ObjectMapper needs an empty constructor
    constructor() : this(
        setOf(""),
        "",
        1234,
        "",
        "",
        EmailSecurity.NONE_STARTTLS,
        false,
    )
}
