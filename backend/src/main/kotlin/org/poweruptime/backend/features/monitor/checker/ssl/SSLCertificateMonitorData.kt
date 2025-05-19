package org.poweruptime.backend.features.monitor.checker.ssl

import jakarta.persistence.Column
import jakarta.persistence.DiscriminatorValue
import jakarta.persistence.Entity
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.monitor.model.MONITOR_CHECKER_DATA_TABLE_NAME
import org.poweruptime.backend.features.monitor.model.MonitorData
import org.poweruptime.backend.features.monitor.model.MonitorDataTypes
import org.poweruptime.backend.features.monitor.model.MonitorType

@Entity(name = "${MONITOR_CHECKER_DATA_TABLE_NAME}_${MonitorDataTypes.SSL_CERTIFICATE}")
@DiscriminatorValue(MonitorDataTypes.SSL_CERTIFICATE)
class SSLCertificateMonitorData(
    @Column(name = "ssl_certificate_url", length = Database.MAX_URL_LENGTH)
    @get:NotBlank
    @get:Size(
        min = Database.MIN_URL_LENGTH,
        max = Database.MAX_URL_LENGTH,
    )
    @get:Pattern(regexp = Database.URL_REGEX)
    val url: String,
    @Column(name = "ssl_certificate_valid_days_left", columnDefinition = "bigint")
    @get:Min(Database.MIN_VALID_DAYS_LEFT)
    @get:Max(Database.MAX_VALID_DAYS_LEFT)
    val validDaysLeft: Long? = null,
) : MonitorData(MonitorType.SSL_CERTIFICATE) {
    // ObjectMapper needs an empty constructor
    constructor() : this(
        "1.2.3.4",
        null,
    )
}
