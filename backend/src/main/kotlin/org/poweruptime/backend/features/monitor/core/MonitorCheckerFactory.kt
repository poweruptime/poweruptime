package org.poweruptime.backend.features.monitor.core

import org.poweruptime.backend.features.monitor.checker.dns.DnsMonitorChecker
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorChecker
import org.poweruptime.backend.features.monitor.checker.ping.PingMonitorChecker
import org.poweruptime.backend.features.monitor.checker.push.PushMonitorChecker
import org.poweruptime.backend.features.monitor.checker.ssl.SSLCertificateMonitorChecker
import org.poweruptime.backend.features.monitor.domain.PushMonitorCheckerEntryRepository
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.team.service.TeamSettingService
import org.springframework.stereotype.Service

@Service
class MonitorCheckerFactory(
    teamSettingService: TeamSettingService,
    pushMonitorCheckerEntryRepository: PushMonitorCheckerEntryRepository,
) {
    private val checkers = listOf(
        DnsMonitorChecker(),
        HttpMonitorChecker(),
        PingMonitorChecker(),
        PushMonitorChecker(pushMonitorCheckerEntryRepository, teamSettingService),
        SSLCertificateMonitorChecker(teamSettingService),
    ).associateBy { it.type }

    fun execute(monitor: Monitor): CheckResultDto {
        val checker = checkers[monitor.checker._type] ?: throw IllegalArgumentException("Unknown monitor: $monitor")

        return checker.execute(monitor)
    }
}
