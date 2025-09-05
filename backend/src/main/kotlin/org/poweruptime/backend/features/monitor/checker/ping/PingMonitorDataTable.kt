package org.poweruptime.backend.features.monitor.checker.ping

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import org.jetbrains.exposed.v1.core.ResultRow
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.monitor.model.MonitorData
import org.poweruptime.backend.features.monitor.model.MonitorDataTable
import org.poweruptime.backend.features.monitor.model.MonitorType

object PingMonitorDataTable : MonitorDataTable(MonitorType.PING) {
    val ip = varchar("ping_ip", Database.MAX_IPV4_LENGTH)
    val port = integer("ping_port")

    override fun rowToRecord(row: ResultRow): PingMonitorDataRecord = PingMonitorDataRecord(
        ip = row[ip],
        port = row[port],
    )
}

data class PingMonitorDataRecord(
    @get:NotBlank
    @get:Size(min = Database.MIN_IPV4_LENGTH, max = Database.MAX_IPV4_LENGTH)
    val ip: String,
    @get:NotNull
    @get:Min(Database.MIN_PORT)
    @get:Max(Database.MAX_PORT)
    val port: Int,
) : MonitorData(MonitorType.PING)
