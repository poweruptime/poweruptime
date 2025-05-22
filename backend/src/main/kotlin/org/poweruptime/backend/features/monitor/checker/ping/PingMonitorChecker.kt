package org.poweruptime.backend.features.monitor.checker.ping

import org.poweruptime.backend.features.monitor.core.*
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.MonitorType
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import java.net.InetSocketAddress
import java.net.Socket

class PingMonitorChecker : MonitorChecker {
    private val logger: Logger = LoggerFactory.getLogger(PingMonitorData::class.java)

    override val type = MonitorType.PING

    override fun execute(monitor: Monitor): CheckResultDto {
        val pingMonitorCheckerData = monitor.checker as PingMonitorData

        logger.debug(
            """Sending ping request for monitor "{}" with id "{}", ip: "{}"""",
            monitor.name,
            monitor.id,
            pingMonitorCheckerData.ip,
        )

        val result = MonitoringResultHandler()
        @Suppress("TooGenericExceptionCaught")
        try {
            Socket().use { soc ->
                soc.connect(InetSocketAddress(pingMonitorCheckerData.ip, pingMonitorCheckerData.port), 4000)
                return result.success("Ping successful")
            }
        } catch (ex: Exception) {
            return result.error("Could not ping address")
        }
    }
}
