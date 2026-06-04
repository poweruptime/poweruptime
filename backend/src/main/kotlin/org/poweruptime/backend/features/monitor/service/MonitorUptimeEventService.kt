package org.poweruptime.backend.features.monitor.service

import org.jetbrains.exposed.v1.jdbc.insert
import org.poweruptime.backend.features.monitor.domain.findLastByMonitorId
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.MonitorUptimeEvent
import org.poweruptime.backend.features.monitor.model.MonitorUptimeEventStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class MonitorUptimeEventService {
    @Transactional
    fun recordTransition(monitorId: ULong, status: MonitorStatus, effectiveAt: Instant = Instant.now()) {
        val eventStatus = when (status) {
            MonitorStatus.UP -> MonitorUptimeEventStatus.UP
            MonitorStatus.DOWN -> MonitorUptimeEventStatus.DOWN
            else -> error("Uptime events only support UP and DOWN, got $status")
        }

        if (MonitorUptimeEvent.findLastByMonitorId(monitorId)?.status == eventStatus) return

        MonitorUptimeEvent.insert {
            it[MonitorUptimeEvent.monitorId] = monitorId
            it[MonitorUptimeEvent.effectiveAt] = effectiveAt
            it[MonitorUptimeEvent.status] = eventStatus
        }
    }

    fun recordOptimisticUp(monitorId: ULong) = recordTransition(monitorId, MonitorStatus.UP)
}
