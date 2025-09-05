package org.poweruptime.backend.features.monitor.core

import org.poweruptime.backend.features.monitor.checker.dns.DnsMonitorDataRecord
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorDataRecord
import org.poweruptime.backend.features.monitor.checker.ping.PingMonitorDataRecord
import org.poweruptime.backend.features.monitor.checker.push.PushMonitorDataRecord
import org.poweruptime.backend.features.monitor.checker.ssl.SSLCertificateMonitorDataRecord
import org.poweruptime.backend.features.monitor.model.MonitorDataTypes

class MonitorDataTypeFactory {
    private val dataTypes = mapOf(
        MonitorDataTypes.DNS to DnsMonitorDataRecord::class.java,
        MonitorDataTypes.HTTP to HttpMonitorDataRecord::class.java,
        MonitorDataTypes.PING to PingMonitorDataRecord::class.java,
        MonitorDataTypes.PUSH to PushMonitorDataRecord::class.java,
        MonitorDataTypes.SSL_CERTIFICATE to SSLCertificateMonitorDataRecord::class.java,
    )

    fun toClass(monitorType: String): Class<*> =
        dataTypes[monitorType] ?: throw IllegalArgumentException("Unknown monitor: $monitorType")

    fun toStringRepresentation(klass: Class<*>?): String = klass?.let { k ->
        dataTypes.entries.find { it.value == k }?.key
            ?: throw IllegalArgumentException("Unknown monitor class: ${k.name}")
    } ?: throw IllegalArgumentException("Class cannot be null")
}
