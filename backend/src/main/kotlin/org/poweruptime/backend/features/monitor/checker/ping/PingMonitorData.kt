package org.poweruptime.backend.features.monitor.checker.ping

import jakarta.persistence.Column
import jakarta.persistence.DiscriminatorValue
import jakarta.persistence.Entity
import jakarta.validation.constraints.*
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.monitor.model.MONITOR_CHECKER_DATA_TABLE_NAME
import org.poweruptime.backend.features.monitor.model.MonitorData
import org.poweruptime.backend.features.monitor.model.MonitorDataTypes
import org.poweruptime.backend.features.monitor.model.MonitorType

@Entity(name = "${MONITOR_CHECKER_DATA_TABLE_NAME}_${MonitorDataTypes.PING}")
@DiscriminatorValue(MonitorDataTypes.PING)
class PingMonitorData(
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
) : MonitorData(MonitorType.PING) {
    // ObjectMapper needs an empty constructor
    constructor() : this("1.2.3.4", 42069)

    override fun clone() = PingMonitorData(
        ip,
        port,
    )
}
