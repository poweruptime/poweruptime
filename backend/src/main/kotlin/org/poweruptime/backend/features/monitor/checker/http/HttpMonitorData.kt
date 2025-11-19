package org.poweruptime.backend.features.monitor.checker.http

import jakarta.validation.Constraint
import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import jakarta.validation.Payload
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
import org.poweruptime.backend.core.ListItemRegex
import org.poweruptime.backend.core.models.enumerationByCode
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.monitor.model.MonitorData
import org.poweruptime.backend.features.monitor.model.MonitorDataTable
import org.poweruptime.backend.features.monitor.model.MonitorType
import kotlin.reflect.KClass

object HttpMonitorData : MonitorDataTable(MonitorType.HTTP) {
    val url = varchar("http_url", Database.MAX_URL_LENGTH)
    val method = enumerationByCode<HttpMonitorDataMethod>("http_method")
    val contentType = enumerationByCode<HttpMonitorDataContentType>("http_content_type")

    val allowedStatusCodeRanges = array<String>("http_allowed_status_code_ranges")

    val maxRedirects = long("http_max_redirects").nullable()
    val ignoreTLS = bool("http_ignore_tls").clientDefault { false }
    val certificateExpiry = bool("http_certificate_expiry").clientDefault { false }
    val certificateValidDaysLeft = long("http_certificate_valid_days_left").nullable()

    val body = text("http_body").nullable()
    val searchTerm = text("http_search_term").nullable()
    val authType = enumerationByCode<HttpMonitorDataAuthType>("http_auth_type").nullable()

    val basicAuthDataUsername = varchar("http_basic_auth_username", Database.MAX_BASIC_AUTH_LENGTH).nullable()
    val basicAuthDataPassword = varchar("http_basic_auth_password", Database.MAX_BASIC_AUTH_LENGTH).nullable()

    override fun rowToRecord(row: ResultRow): HttpMonitorDataRecord = HttpMonitorDataRecord(
        url = row[url],
        method = row[method],
        contentType = row[contentType],
        allowedStatusCodeRanges = row[allowedStatusCodeRanges],
        maxRedirects = row[maxRedirects],
        ignoreTLS = row[ignoreTLS],
        certificateExpiry = row[certificateExpiry],
        certificateValidDaysLeft = row[certificateValidDaysLeft],
        body = row[body],
        searchTerm = row[searchTerm],
        authType = row[authType],
        basicAuthDataUsername = row[basicAuthDataUsername],
        basicAuthDataPassword = row[basicAuthDataPassword],
    )

    override fun insert(monitorId: ULong, data: MonitorData) {
        data as HttpMonitorDataRecord

        insert {
            it[id] = monitorId
            it[url] = data.url
            it[method] = data.method
            it[contentType] = data.contentType
            it[allowedStatusCodeRanges] = data.allowedStatusCodeRanges
            it[maxRedirects] = data.maxRedirects
            it[ignoreTLS] = data.ignoreTLS
            it[certificateExpiry] = data.certificateExpiry
            it[certificateValidDaysLeft] = data.certificateValidDaysLeft
            it[body] = data.body
            it[searchTerm] = data.searchTerm
            it[authType] = data.authType
            it[basicAuthDataUsername] = data.basicAuthDataUsername
            it[basicAuthDataPassword] = data.basicAuthDataPassword
        }
    }

    override fun update(monitorId: ULong, data: MonitorData) {
        data as HttpMonitorDataRecord

        update({ id eq monitorId }) {
            it[url] = data.url
            it[method] = data.method
            it[contentType] = data.contentType
            it[allowedStatusCodeRanges] = data.allowedStatusCodeRanges
            it[maxRedirects] = data.maxRedirects
            it[ignoreTLS] = data.ignoreTLS
            it[certificateExpiry] = data.certificateExpiry
            it[certificateValidDaysLeft] = data.certificateValidDaysLeft
            it[body] = data.body
            it[searchTerm] = data.searchTerm
            it[authType] = data.authType
            it[basicAuthDataUsername] = data.basicAuthDataUsername
            it[basicAuthDataPassword] = data.basicAuthDataPassword
        }
    }

    init {
        registerTable(this)
    }
}

data class HttpMonitorDataRecord(
    @get:NotBlank
    @get:Size(min = Database.MIN_URL_LENGTH, max = Database.MAX_URL_LENGTH)
    @get:Pattern(regexp = Database.URL_REGEX)
    val url: String,

    @get:NotNull
    val method: HttpMonitorDataMethod,

    @get:NotNull
    val contentType: HttpMonitorDataContentType,

    @get:NotNull
    @get:Size(min = Database.MIN_STATUS_CODES)
    @get:ListItemRegex(
        pattern = Database.STATUS_CODE_REGEX,
        message = "Each StatusCode range must be in the form “XXX - YYY”",
    )
    @get:StatusCodeRangeOrder
    val allowedStatusCodeRanges: List<String>,

    @get:Min(Database.MIN_REDIRECTS)
    @get:Max(Database.MAX_REDIRECTS)
    val maxRedirects: Long? = null,

    @get:NotNull
    val ignoreTLS: Boolean = false,

    @get:NotNull
    val certificateExpiry: Boolean = false,

    @get:Min(Database.MIN_VALID_DAYS_LEFT)
    @get:Max(Database.MAX_VALID_DAYS_LEFT)
    val certificateValidDaysLeft: Long? = null,

    val body: String? = null,

    val searchTerm: String? = null,

    val authType: HttpMonitorDataAuthType? = null,

    @get:Size(max = Database.MAX_BASIC_AUTH_LENGTH)
    val basicAuthDataUsername: String? = null,
    @get:Size(max = Database.MAX_BASIC_AUTH_LENGTH)
    val basicAuthDataPassword: String? = null,
) : MonitorData(MonitorType.HTTP) {
    fun getAllowedStatusCodesRanges(): List<IntRange> = allowedStatusCodeRanges.map { statusCodeRange ->
        val parts = statusCodeRange.split("-").map(String::trim)
        require(parts.size == 2)

        parts[0].toInt()..parts[1].toInt()
    }
}

@Target(
    AnnotationTarget.FIELD,
    AnnotationTarget.PROPERTY_GETTER,
    AnnotationTarget.VALUE_PARAMETER,
)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [StatusCodeRangeOrderValidator::class])
@MustBeDocumented
annotation class StatusCodeRangeOrder(
    val message: String = "Each status‐code range must have start =< end",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)

class StatusCodeRangeOrderValidator : ConstraintValidator<StatusCodeRangeOrder, List<String>> {
    override fun isValid(
        value: List<String>?,
        context: ConstraintValidatorContext
    ): Boolean {
        // null==valid here; @NotNull handles null if you've added it
        if (value == null) return true

        return value.all { rangeStr ->
            val parts = rangeStr.split("-").map(String::trim)
            if (parts.size != 2) return@all false

            val start = parts[0].toIntOrNull() ?: return@all false
            val end = parts[1].toIntOrNull() ?: return@all false

            start <= end
        }
    }
}
