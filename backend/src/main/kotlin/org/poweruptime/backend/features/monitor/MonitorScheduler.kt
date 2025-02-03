package org.poweruptime.backend.features.monitor

import org.poweruptime.backend.amqp.RabbitMQService
import org.poweruptime.backend.core.utils.RandomGenerator
import org.poweruptime.backend.features.monitor.model.CheckResult
import org.poweruptime.backend.features.monitor.model.CheckResultLogStage
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.service.CheckResultLogEntryService
import org.poweruptime.backend.features.monitor.service.CheckResultService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.TaskScheduler
import org.springframework.stereotype.Service
import java.time.Duration
import java.time.Instant
import java.util.concurrent.ScheduledFuture

const val MONITOR_BOOT_SPREAD_TIME_IN_MILLIS = 30 * 1000

@Service
class MonitorScheduler(
    private val taskScheduler: TaskScheduler,
    private val checkResultService: CheckResultService,
    private val checkResultLogEntryService: CheckResultLogEntryService,
    private val rabbitMQService: RabbitMQService,
) {
    private final val logger = LoggerFactory.getLogger(MonitorScheduler::class.java)

    private val schedules = mutableMapOf<String, ScheduledFuture<*>>()

    fun start(monitor: Monitor, booting: Boolean = false) {
        stop(monitor.id)

        if (monitor.status === MonitorStatus.PAUSED) {
            return
        }

        val startDelay = if (booting) {
            RandomGenerator.int(0, MONITOR_BOOT_SPREAD_TIME_IN_MILLIS).toLong()
        } else {
            0
        }

        val startAt = Instant.now().plusMillis(startDelay)

        logger.info(
            """Started monitor "{}" with id "{}" at rate of "{}s" with a delay of "{}ms" """,
            monitor.name,
            monitor.id,
            monitor.testIntervalSeconds,
            startDelay,
        )

        schedules[monitor.id] = taskScheduler.scheduleAtFixedRate(
            {
                val checkResult = checkResultService.save(
                    CheckResult(
                        monitor = monitor,
                    ),
                )
                logger.debug(
                    """Queuing monitor "{}" with id "{}" for run "{}"""",
                    monitor.name, monitor.id, checkResult.id,
                )
                rabbitMQService.sendToProcessMonitor(checkResult.id)
                checkResultLogEntryService.info(CheckResultLogStage.SETUP, checkResult, "Queued for processing")
            },
            startAt,
            Duration.ofSeconds(monitor.testIntervalSeconds),
        )
    }

    fun stop(monitorId: String) = schedules[monitorId]?.let {
        it.cancel(true)
        logger.info("""Stopped monitor "{}"""", monitorId)
    }
}
