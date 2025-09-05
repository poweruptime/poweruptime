package org.poweruptime.backend.features.monitor.checker.ping

import io.github.oshai.kotlinlogging.KotlinLogging
import org.poweruptime.backend.features.monitor.core.*
import org.poweruptime.backend.features.monitor.model.MonitorData
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.MonitorType
import java.net.InetSocketAddress
import java.net.Socket

class PingMonitorChecker : MonitorChecker {
    private final val logger = KotlinLogging.logger {}

    override val type = MonitorType.PING

    override fun execute(monitor: MonitorRecord, data: MonitorData): CheckResultDto {
        val pingMonitorCheckerData = data as PingMonitorDataRecord

        logger.debug {
            "Sending ping request for monitor '${monitor.name}' with id '${monitor.id}', " +
                "ip: '${pingMonitorCheckerData.ip}'"
        }

        val result = MonitoringResultHandler()
        @Suppress("TooGenericExceptionCaught")
        try {
            Socket().use { soc ->
                soc.connect(InetSocketAddress(pingMonitorCheckerData.ip, pingMonitorCheckerData.port), 4000)
                return result.success("Ping successful")
            }
        } catch (_: Exception) {
            return result.error("Could not ping address")
        }
    }
}
