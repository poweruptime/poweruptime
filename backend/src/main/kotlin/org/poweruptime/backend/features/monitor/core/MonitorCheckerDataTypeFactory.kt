package org.poweruptime.backend.features.monitor.core

import org.poweruptime.backend.features.monitor.checker.dns.DnsMonitorCheckerData
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorCheckerData
import org.poweruptime.backend.features.monitor.checker.ping.PingMonitorCheckerData
import org.poweruptime.backend.features.monitor.checker.push.PushMonitorCheckerData
import org.poweruptime.backend.features.monitor.checker.ssl.SSLCertificateMonitorCheckerData

class MonitorCheckerDataTypeFactory {
    private val checkersData = mapOf(
        MonitorCheckerTypes.DNS to DnsMonitorCheckerData::class.java,
        MonitorCheckerTypes.HTTP to HttpMonitorCheckerData::class.java,
        MonitorCheckerTypes.PING to PingMonitorCheckerData::class.java,
        MonitorCheckerTypes.PUSH to PushMonitorCheckerData::class.java,
        MonitorCheckerTypes.SSL_CERTIFICATE to SSLCertificateMonitorCheckerData::class.java,
    )

    fun toClass(monitorType: String): Class<*> =
        checkersData[monitorType] ?: throw IllegalArgumentException("Unknown monitor: $monitorType")

    fun toStringRepresentation(klass: Class<*>?): String = klass?.let { k ->
        checkersData.entries.find { it.value == k }?.key
            ?: throw IllegalArgumentException("Unknown checker class: ${k.name}")
    } ?: throw IllegalArgumentException("Class cannot be null")
}
