package org.poweruptime.backend.features.monitor.checker.http

import jakarta.persistence.Column
import jakarta.persistence.DiscriminatorValue
import jakarta.persistence.Entity
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
import org.poweruptime.backend.core.ListItemRegex
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.monitor.model.MONITOR_CHECKER_DATA_TABLE_NAME
import org.poweruptime.backend.features.monitor.model.MonitorData
import org.poweruptime.backend.features.monitor.model.MonitorDataTypes
import org.poweruptime.backend.features.monitor.model.MonitorType
import kotlin.reflect.KClass

@Entity(name = "${MONITOR_CHECKER_DATA_TABLE_NAME}_${MonitorDataTypes.HTTP}")
@DiscriminatorValue(MonitorDataTypes.HTTP)
class HttpMonitorData(
    @Column(name = "http_url", length = Database.MAX_URL_LENGTH)
    @get:NotBlank
    @get:Size(min = Database.MIN_URL_LENGTH, max = Database.MAX_URL_LENGTH)
    @get:Pattern(regexp = Database.URL_REGEX)
    val url: String,

    @Column(name = "http_method", length = 7)
    @get:NotNull
    val method: HttpMonitorDataMethod,

    @Column(name = "http_content_type", length = 4)
    @get:NotNull
    val contentType: HttpMonitorDataContentType,

    @Suppress("JpaAttributeTypeInspection")
    @Column(name = "http_allowed_status_code_ranges", columnDefinition = "text[]")
    @get:NotNull
    @get:Size(min = Database.MIN_STATUS_CODES)
    @get:ListItemRegex(
        pattern = Database.STATUS_CODE_REGEX,
        message = "Each StatusCode range must be in the form “XXX - YYY”",
    )
    @get:StatusCodeRangeOrder
    val allowedStatusCodeRanges: List<String>,

    @Column(name = "http_max_redirects", columnDefinition = "bigint")
    @get:Min(Database.MIN_REDIRECTS)
    @get:Max(Database.MAX_REDIRECTS)
    val maxRedirects: Long? = null,

    @Column(name = "http_ignore_tls", columnDefinition = "boolean")
    @get:NotNull
    val ignoreTLS: Boolean = false,

    @Column(name = "http_certificate_expiry", columnDefinition = "boolean")
    @get:NotNull
    val certificateExpiry: Boolean = false,

    @Column(name = "http_certificate_valid_days_left", columnDefinition = "bigint")
    @get:Min(Database.MIN_VALID_DAYS_LEFT)
    @get:Max(Database.MAX_VALID_DAYS_LEFT)
    val certificateValidDaysLeft: Long? = null,

    @Column(name = "http_body", columnDefinition = "text")
    val body: String? = null,

    @Column(name = "http_search_term", columnDefinition = "text")
    val searchTerm: String? = null,

    @Column(name = "http_auth_type", length = 5)
    val authType: HttpMonitorDataAuthType? = null,

    @Column(name = "http_basic_auth_username", length = 512)
    @get:Size(max = Database.MAX_BASIC_AUTH_LENGTH)
    val basicAuthDataUsername: String? = null,

    @Column(name = "http_basic_auth_password", length = 512)
    @get:Size(max = Database.MAX_BASIC_AUTH_LENGTH)
    val basicAuthDataPassword: String? = null,
) : MonitorData(MonitorType.HTTP) {
    // ObjectMapper needs an empty constructor
    constructor() : this(
        "1.2.3.4",
        HttpMonitorDataMethod.GET,
        HttpMonitorDataContentType.JSON,
        listOf(""),
        10,
        false,
        false,
        null,
        null,
        null,
        null,
        null,
        null,
    )

    fun getAllowedStatusCodesRanges(): List<IntRange> = allowedStatusCodeRanges.map { statusCodeRange ->
        val parts = statusCodeRange.split("-").map(String::trim)
        require(parts.size == 2)

        parts[0].toInt()..parts[1].toInt()
    }

    override fun clone() = HttpMonitorData(
        url,
        method,
        contentType,
        allowedStatusCodeRanges,
        maxRedirects,
        ignoreTLS,
        certificateExpiry,
        certificateValidDaysLeft,
        body,
        searchTerm,
        authType,
        basicAuthDataUsername,
        basicAuthDataPassword,
    )
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
