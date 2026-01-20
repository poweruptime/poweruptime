package org.poweruptime.backend.features.monitor.checkers.ping

import io.github.oshai.kotlinlogging.KotlinLogging
import org.poweruptime.backend.features.monitor.checkers.CheckResultDto
import org.poweruptime.backend.features.monitor.checkers.MonitorChecker
import org.poweruptime.backend.features.monitor.checkers.MonitoringResultHandler
import org.poweruptime.backend.features.monitor.core.MonitorData
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.MonitorType
import java.net.InetSocketAddress
import java.net.Socket

class PingMonitorChecker : MonitorChecker(MonitorType.PING) {
    private final val logger = KotlinLogging.logger {}

    override fun execute(monitor: MonitorRecord, data: MonitorData): CheckResultDto {
        data as PingMonitorDataRecord

        logger.debug {
            "Sending ping request for monitor '${monitor.name}' with id '${monitor.id}', " +
                "ip: '${data.ip}'"
        }

        val result = MonitoringResultHandler()
        try {
            Socket().use { soc ->
                soc.connect(InetSocketAddress(data.ip, data.port), 4000)
                return result.success("Ping successful")
            }
        } catch (_: Exception) {
            return result.error("Could not ping address")
        }
    }
}
