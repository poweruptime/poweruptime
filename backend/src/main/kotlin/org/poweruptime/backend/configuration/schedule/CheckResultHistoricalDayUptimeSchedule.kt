package org.poweruptime.backend.configuration.schedule

import io.github.oshai.kotlinlogging.KotlinLogging
import org.poweruptime.backend.features.monitor.service.CheckResultStatisticsService
import org.poweruptime.backend.features.monitor.service.MonitorService
import org.springframework.context.annotation.Configuration
import org.springframework.scheduling.annotation.EnableScheduling
import org.springframework.scheduling.annotation.Scheduled

const val FIFTEEN_MINUTES_IN_MILLI_SECONDS = 900_000L

@Configuration
@EnableScheduling
class CheckResultHistoricalDayUptimeSchedule(
    private val checkResultStatisticsService: CheckResultStatisticsService,
    private val monitorService: MonitorService,
) {
    private final val logger = KotlinLogging.logger {}

    // Runs one minute after 00:00 every 24 hours
    @Scheduled(cron = "0 1 0 * * *")
    fun checkResultSync() {
        execute()
    }

    // Runs 15 minutes after instance start
    @Scheduled(initialDelay = FIFTEEN_MINUTES_IN_MILLI_SECONDS)
    fun checkResultDelayed() {
        execute()
    }

    private fun execute() {
        monitorService.getAllNoneDeleted().forEach {
            logger.debug { "Syncing check results of '${it.id}' to historical day uptime" }
            checkResultStatisticsService.syncCheckResultsToHistoricalDayUptime(it.id)
        }
    }
}
