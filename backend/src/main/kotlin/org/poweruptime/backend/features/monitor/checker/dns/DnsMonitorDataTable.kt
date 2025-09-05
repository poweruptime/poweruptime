package org.poweruptime.backend.features.monitor.checker.dns

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.jetbrains.exposed.v1.core.ResultRow
import org.poweruptime.backend.core.models.enumerationByCode
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.monitor.model.MonitorData
import org.poweruptime.backend.features.monitor.model.MonitorDataTable
import org.poweruptime.backend.features.monitor.model.MonitorType

object DnsMonitorDataTable : MonitorDataTable(MonitorType.DNS) {
    val host = varchar("dns_host", Database.MAX_DOMAIN_LENGTH)
    val server = varchar("dns_server", Database.MAX_IPV4_LENGTH)
    val port = integer("dns_port")
    val type = enumerationByCode<DnsMonitorDataType>("dns_type")

    val matches = array<String>("dns_matches").nullable()

    override fun rowToRecord(row: ResultRow): DnsMonitorDataRecord = DnsMonitorDataRecord(
        host = row[host],
        server = row[server],
        port = row[port],
        type = row[type],
        matches = row[matches],
    )
}

data class DnsMonitorDataRecord(
    @get:NotBlank
    @get:Size(
        min = Database.MIN_DOMAIN_LENGTH,
        max = Database.MAX_DOMAIN_LENGTH,
    )
    @get:Pattern(regexp = Database.DOMAIN_REGEX)
    val host: String,
    @get:NotBlank
    @get:Size(
        min = Database.MIN_IPV4_LENGTH,
        max = Database.MAX_IPV4_LENGTH,
    )
    @get:Pattern(regexp = Database.IPV4_REGEX)
    val server: String,
    @get:NotNull
    @get:Min(Database.MIN_PORT)
    @get:Max(Database.MAX_PORT)
    val port: Int,
    @get:NotNull
    val type: DnsMonitorDataType,
    val matches: List<String>?,
) : MonitorData(MonitorType.DNS)
