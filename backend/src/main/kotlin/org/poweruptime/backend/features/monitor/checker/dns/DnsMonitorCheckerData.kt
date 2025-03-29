package org.poweruptime.backend.features.monitor.checker.dns

import jakarta.persistence.Column
import jakarta.persistence.DiscriminatorValue
import jakarta.persistence.Entity
import jakarta.validation.constraints.*
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.monitor.core.*

@Entity(name = "${MONITOR_CHECKER_DATA_TABLE_NAME}_${MonitorCheckerTypes.DNS}")
@DiscriminatorValue(MonitorCheckerTypes.DNS)
class DnsMonitorCheckerData(
    // Domain max length is 253
    @Column(name = "dns_host", length = Database.MAX_DOMAIN_LENGTH)
    @get:NotBlank
    @get:Size(
        min = Database.MIN_DOMAIN_LENGTH,
        max = Database.MAX_DOMAIN_LENGTH,
    )
    @get:Pattern(regexp = Database.DOMAIN_REGEX)
    val host: String,

    @Column(name = "dns_server", length = Database.MAX_IPV4_LENGTH)
    @get:NotBlank
    @get:Size(
        min = Database.MIN_IPV4_LENGTH,
        max = Database.MAX_IPV4_LENGTH,
    )
    @get:Pattern(regexp = Database.IPV4_REGEX)
    val server: String,

    @Column(name = "dns_port")
    @get:NotNull
    @get:Min(Database.MIN_PORT)
    @get:Max(Database.MAX_PORT)
    val port: Int,

    @Column(name = "dns_type", length = 5)
    @get:NotNull
    val type: DnsMonitorCheckerDataType,

    @Suppress("JpaAttributeTypeInspection")
    @Column(
        name = "dns_matches",
        columnDefinition = "text[]",
    )
    val matches: List<String>? = null,
) : MonitorCheckerData(MonitorCheckerType.DNS) {
    // ObjectMapper needs an empty constructor
    constructor() : this("1.2.3.4", "1.2.3.4", 1, DnsMonitorCheckerDataType.TXT, null)
}
