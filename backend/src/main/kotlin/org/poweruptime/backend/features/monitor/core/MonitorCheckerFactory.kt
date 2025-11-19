package org.poweruptime.backend.features.monitor.core

import org.poweruptime.backend.features.monitor.checker.dns.DnsMonitorChecker
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorChecker
import org.poweruptime.backend.features.monitor.checker.ping.PingMonitorChecker
import org.poweruptime.backend.features.monitor.checker.push.PushMonitorChecker
import org.poweruptime.backend.features.monitor.checker.ssl.SSLCertificateMonitorChecker
import org.poweruptime.backend.features.monitor.domain.PushMonitorCheckerEntryRepository
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.service.MonitorDataService
import org.poweruptime.backend.features.team.service.TeamSettingService
import org.springframework.stereotype.Service

@Service
class MonitorCheckerFactory(
    teamSettingService: TeamSettingService,
    val monitorDataService: MonitorDataService,
) {
    private val checkers = listOf(
        DnsMonitorChecker(),
        HttpMonitorChecker(teamSettingService),
        PingMonitorChecker(),
        PushMonitorChecker(
            pushMonitorCheckerEntryRepository = PushMonitorCheckerEntryRepository(),
            teamSettingService,
        ),
        SSLCertificateMonitorChecker(teamSettingService),
    ).associateBy { it.type }

    fun execute(monitor: MonitorRecord): CheckResultDto {
        val checker = checkers[monitor.type] ?: throw IllegalArgumentException("Unknown monitor type: ${monitor.type}")
        return checker.execute(monitor, data = monitorDataService.findByIdAndType(monitor.id, monitor.type))
    }
}
