package org.poweruptime.backend.features.monitor.checker.http

import jakarta.persistence.Column
import jakarta.persistence.DiscriminatorValue
import jakarta.persistence.Entity
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.monitor.core.*

@Entity(name = "${MONITOR_CHECKER_DATA_TABLE_NAME}_${MonitorCheckerTypes.HTTP}")
@DiscriminatorValue(MonitorCheckerTypes.HTTP)
class HttpMonitorCheckerData(
    @Column(name = "http_url", length = Database.MAX_URL_LENGTH)
    @get:NotBlank
    @get:Size(min = Database.MIN_URL_LENGTH, max = Database.MAX_URL_LENGTH)
    @get:Pattern(regexp = Database.URL_REGEX)
    val url: String,

    @Column(name = "http_method", length = 7)
    @get:NotNull
    val method: HttpMonitorCheckerDataMethod,

    @Column(name = "http_content_type", length = 4)
    @get:NotNull
    val contentType: HttpMonitorCheckerDataContentType,

    @Column(name = "http_ignore_tls", columnDefinition = "boolean")
    @get:NotNull
    val ignoreTLS: Boolean = false,

    @Column(name = "http_body", columnDefinition = "text")
    val body: String? = null,

    @Column(name = "http_search_term", columnDefinition = "text")
    val searchTerm: String? = null,

    @Column(name = "http_auth_type", length = 5)
    val authType: HttpMonitorCheckerDataAuthType? = null,

    @Column(name = "http_basic_auth_username", length = 512)
    @get:Size(max = Database.MAX_BASIC_AUTH_LENGTH)
    val basicAuthDataUsername: String? = null,

    @Column(name = "http_basic_auth_password", length = 512)
    @get:Size(max = Database.MAX_BASIC_AUTH_LENGTH)
    val basicAuthDataPassword: String? = null,
) : MonitorCheckerData(MonitorCheckerType.HTTP) {
    // ObjectMapper needs an empty constructor
    @Suppress("unused")
    constructor() : this(
        "1.2.3.4",
        HttpMonitorCheckerDataMethod.GET,
        HttpMonitorCheckerDataContentType.JSON,
        false,
        null,
        null,
        null,
        null,
        null,
    )
}
