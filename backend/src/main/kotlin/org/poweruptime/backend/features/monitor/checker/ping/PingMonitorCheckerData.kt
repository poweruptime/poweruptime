package org.poweruptime.backend.features.monitor.checker.ping

import jakarta.persistence.Column
import jakarta.persistence.DiscriminatorValue
import jakarta.persistence.Entity
import jakarta.validation.constraints.*
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.monitor.core.*

@Entity(name = "${MONITOR_CHECKER_DATA_TABLE_NAME}_${MonitorCheckerTypes.PING}")
@DiscriminatorValue(MonitorCheckerTypes.PING)
class PingMonitorCheckerData(
    @Column(name = "ping_ip", length = Database.MAX_IPV4_LENGTH)
    @get:NotBlank
    @get:Size(min = Database.MIN_IPV4_LENGTH, max = Database.MAX_IPV4_LENGTH)
    @get:Pattern(regexp = Database.IPV4_REGEX)
    val ip: String,
    @Column(name = "ping_port")
    @get:NotNull
    @get:Min(Database.MIN_PORT)
    @get:Max(Database.MAX_PORT)
    val port: Int,
) : MonitorCheckerData(MonitorCheckerType.PING) {

    // ObjectMapper needs an empty constructor
    @Suppress("unused")
    constructor() : this("1.2.3.4", 42069)
}
