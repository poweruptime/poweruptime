package org.poweruptime.backend.features.notification.notificationMethods.email

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.jetbrains.exposed.v1.core.ResultRow
import org.poweruptime.backend.core.models.enumerationByCode
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.mail.EmailSecurity
import org.poweruptime.backend.features.mail.EmailSender
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.model.NotificationMethodData
import org.poweruptime.backend.features.notification.model.NotificationMethodDataTable

object EmailNotificationMethodDataTable : NotificationMethodDataTable(NotificationMethodType.EMAIL) {
    val to = array<String>("mail_to")

    val host = varchar("mail_host", Database.MAX_DOMAIN_LENGTH)
    val port = integer("mail_port")

    val username = varchar("mail_username", Database.MAX_BASIC_AUTH_LENGTH)
    val password = varchar("mail_password", Database.MAX_BASIC_AUTH_LENGTH)

    val security = enumerationByCode<EmailSecurity>("mail_security")
    val ignoreTLSErrors = bool("mail_ignore_tls_errors")

    val cc = array<String>("mail_cc").nullable()
    val bcc = array<String>("mail_bcc").nullable()

    override fun rowToRecord(row: ResultRow): EmailNotificationMethodDataRecord = EmailNotificationMethodDataRecord(
        to = row[to].toSet(),
        host = row[host],
        port = row[port],
        username = row[username],
        password = row[password],
        security = row[security],
        ignoreTLSErrors = row[ignoreTLSErrors],
        cc = row[cc]?.toSet(),
        bcc = row[bcc]?.toSet(),
    )
}

data class EmailNotificationMethodDataRecord(
    val to: Set<String>,

    @get:NotBlank
    @get:Size(
        min = Database.MIN_DOMAIN_LENGTH,
        max = Database.MAX_DOMAIN_LENGTH,
    )
    @get:Pattern(regexp = Database.DOMAIN_REGEX)
    override val host: String,

    @get:NotNull
    @get:Min(Database.MIN_PORT)
    @get:Max(Database.MAX_PORT)
    override val port: Int,

    @get:NotBlank
    @get:Size(max = Database.MAX_BASIC_AUTH_LENGTH)
    override val username: String,

    @get:NotBlank
    @get:Size(max = Database.MAX_BASIC_AUTH_LENGTH)
    override val password: String,

    @get:NotNull
    override val security: EmailSecurity,

    @get:NotNull
    override val ignoreTLSErrors: Boolean,

    val cc: Set<String>?,
    val bcc: Set<String>?,
) : NotificationMethodData(NotificationMethodType.EMAIL), EmailSender
