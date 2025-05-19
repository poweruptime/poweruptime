package org.poweruptime.backend.features.monitor.core

import org.poweruptime.backend.features.monitor.checker.dns.DnsMonitorData
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorData
import org.poweruptime.backend.features.monitor.checker.ping.PingMonitorData
import org.poweruptime.backend.features.monitor.checker.push.PushMonitorData
import org.poweruptime.backend.features.monitor.checker.ssl.SSLCertificateMonitorData
import org.poweruptime.backend.features.monitor.model.MonitorDataTypes

class MonitorDataTypeFactory {
    private val dataTypes = mapOf(
        MonitorDataTypes.DNS to DnsMonitorData::class.java,
        MonitorDataTypes.HTTP to HttpMonitorData::class.java,
        MonitorDataTypes.PING to PingMonitorData::class.java,
        MonitorDataTypes.PUSH to PushMonitorData::class.java,
        MonitorDataTypes.SSL_CERTIFICATE to SSLCertificateMonitorData::class.java,
    )

    fun toClass(monitorType: String): Class<*> =
        dataTypes[monitorType] ?: throw IllegalArgumentException("Unknown monitor: $monitorType")

    fun toStringRepresentation(klass: Class<*>?): String = klass?.let { k ->
        dataTypes.entries.find { it.value == k }?.key
            ?: throw IllegalArgumentException("Unknown monitor class: ${k.name}")
    } ?: throw IllegalArgumentException("Class cannot be null")
}
