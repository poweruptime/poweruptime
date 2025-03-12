package org.poweruptime.backend.configuration.schedule

import org.poweruptime.backend.features.monitor.service.CheckResultService
import org.poweruptime.backend.features.monitor.service.MonitorService
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Configuration
import org.springframework.scheduling.annotation.EnableScheduling
import org.springframework.scheduling.annotation.Scheduled

@Configuration
@EnableScheduling
class CheckResultHistoricalDayUptimeSchedule(
    private val checkResultService: CheckResultService,
    private val monitorService: MonitorService,
) {
    val logger: Logger = LoggerFactory.getLogger(CheckResultHistoricalDayUptimeSchedule::class.java)

    // Runs one minute after 00:00 every 24 hours
    @Scheduled(cron = "0 1 0 * * *")
    fun checkResultSync() {
        monitorService.getAll().forEach {
            logger.debug("Syncing check results of '{}' to historical day uptime", it.id)
            checkResultService.syncCheckResultsToHistoricalDayUptime(it)
        }
    }
}
