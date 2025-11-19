package org.poweruptime.backend.features.notification.notificationMethods.email

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.models.enumerationByCode
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.mail.EmailSecurity
import org.poweruptime.backend.features.mail.EmailSender
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.core.NotificationMethodTypes
import org.poweruptime.backend.features.notification.model.NotificationMethodData
import org.poweruptime.backend.features.notification.model.NotificationMethodDataTable
import kotlin.collections.toList

object EmailNotificationMethodData : NotificationMethodDataTable(NotificationMethodType.EMAIL) {
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

    override fun insert(
        notificationMethodId: ULong,
        data: NotificationMethodData
    ) {
        data as EmailNotificationMethodDataRecord

        insert {
            it[id] = notificationMethodId
            it[to] = data.to.toList()
            it[host] = data.host
            it[port] = data.port
            it[username] = data.username
            it[password] = data.password
            it[security] = data.security
            it[ignoreTLSErrors] = data.ignoreTLSErrors
            it[cc] = data.cc?.toList()
            it[bcc] = data.bcc?.toList()
        }
    }

    override fun update(
        notificationMethodId: ULong,
        data: NotificationMethodData
    ) {
        data as EmailNotificationMethodDataRecord

        update({ id eq notificationMethodId }) {
            it[to] = data.to.toList()
            it[host] = data.host
            it[port] = data.port
            it[username] = data.username
            it[password] = data.password
            it[security] = data.security
            it[ignoreTLSErrors] = data.ignoreTLSErrors
            it[cc] = data.cc?.toList()
            it[bcc] = data.bcc?.toList()
        }
    }

    init {
        registerTable(this)
    }
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
) : NotificationMethodData(NotificationMethodType.EMAIL), EmailSender {
    companion object {
        init {
            registerDataRecord(NotificationMethodTypes.EMAIL, EmailNotificationMethodDataRecord::class)
        }
    }
}
