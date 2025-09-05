package org.poweruptime.backend.features.monitor

import io.github.oshai.kotlinlogging.KotlinLogging
import org.poweruptime.backend.amqp.RabbitMQService
import org.poweruptime.backend.core.utils.Config
import org.poweruptime.backend.core.utils.RandomGenerator
import org.poweruptime.backend.features.monitor.model.CheckResult
import org.poweruptime.backend.features.monitor.model.CheckResultLogStage
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.service.CheckResultLogEntryService
import org.poweruptime.backend.features.monitor.service.CheckResultService
import org.springframework.beans.factory.annotation.Value
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
    @Value(Config.MONITOR_AUTOSTART_ENABLED) private val monitorAutostartEnabled: Boolean = true,
) {
    private final val logger = KotlinLogging.logger {}

    private val schedules = mutableMapOf<String, ScheduledFuture<*>>()

    fun start(monitor: Monitor, booting: Boolean = false) {
        stop(monitor.id)

        if (!monitorAutostartEnabled) {
            logger.info { "Monitor ${monitor.id} prevented from starting. monitor autostart disabled" }
            return
        }

        if (monitor.status === MonitorStatus.PAUSED) {
            return
        }

        val startDelay = if (booting) {
            RandomGenerator.int(0, MONITOR_BOOT_SPREAD_TIME_IN_MILLIS).toLong()
        } else {
            0
        }

        val startAt = Instant.now().plusMillis(startDelay)

        logger.info {
            "Started monitor '${monitor.name}' with id '${monitor.id}' at rate of " +
                "'${monitor.testIntervalSeconds}s' with a delay of '${startDelay}ms' "
        }

        schedules[monitor.id] = taskScheduler.scheduleAtFixedRate(
            {
                val checkResult = checkResultService.save(
                    CheckResult(
                        monitor = monitor,
                    ),
                )
                logger.debug {
                    "Queuing monitor '${monitor.name}' with id '${monitor.id}' for run '${checkResult.id}'"
                }
                rabbitMQService.sendToProcessMonitor(checkResult.id)
                checkResultLogEntryService.info(CheckResultLogStage.SETUP, checkResult, "Queued for processing")
            },
            startAt,
            Duration.ofSeconds(monitor.testIntervalSeconds),
        )
    }

    fun stop(monitorId: String) = schedules[monitorId]?.let {
        it.cancel(true)
        logger.info { "Stopped monitor '$monitorId'" }
    }
}
