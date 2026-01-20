package org.poweruptime.backend.features.monitor.checker

import io.github.oshai.kotlinlogging.KotlinLogging
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.abbreviate
import org.poweruptime.backend.features.monitor.checkers.MonitorCheckerFactory
import org.poweruptime.backend.features.monitor.model.CheckResultLogStage
import org.poweruptime.backend.features.monitor.model.CheckResultRecord
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.service.CheckResultLogEntryService
import org.springframework.stereotype.Component
import java.time.Duration
import java.time.Instant

private const val QUEUE_MONITOR_TIMEOUT_SECONDS = 10L

/**
 * Extension function to flip [Boolean] if [upsideDown] is true.
 */
private fun Boolean.adjustForUpsideDown(upsideDown: Boolean) = if (upsideDown) !this else this

@Component
class MonitorCheckExecutor(
    private val monitorCheckerFactory: MonitorCheckerFactory,
    private val checkResultLogEntryService: CheckResultLogEntryService,
) {
    private val logger = KotlinLogging.logger {}

    /**
     * Executes the health check and returns what to persist.
     * NO database operations - pure business logic.
     */
    fun execute(checkResult: CheckResultRecord, context: MonitorCheckContext): CheckExecutionOutcome {
        val pickedUpAt = Instant.now()

        // Validation: picked up too late?
        if (isPickedUpTooLate(checkResult.createdAt, pickedUpAt)) {
            logLatePickup(checkResult, pickedUpAt)
            return CheckExecutionOutcome.Late(pickedUpAt)
        }

        // Skip if paused/maintenance
        if (context.monitor.status in listOf(MonitorStatus.PAUSED, MonitorStatus.MAINTENANCE)) {
            logSkipped(checkResult.id)
            return CheckExecutionOutcome.Skipped(context.monitor.status, pickedUpAt)
        }

        // Perform actual check
        logCheckStarting(checkResult.id)
        val (pingMs, isUp, title, message) = monitorCheckerFactory.execute(context.monitor)

        val finalStatus = if (isUp.adjustForUpsideDown(context.monitor.upsideDown)) {
            MonitorStatus.UP
        } else {
            MonitorStatus.DOWN
        }

        val timesRetried = if (finalStatus == MonitorStatus.DOWN) {
            (context.previousCheckResult?.timesRetried ?: 0) + 1
        } else {
            0
        }

        logCheckCompleted(checkResult.id, pingMs, isUp.adjustForUpsideDown(context.monitor.upsideDown))

        return CheckExecutionOutcome.Completed(
            status = finalStatus,
            pickedUpAt = pickedUpAt,
            checkedAt = Instant.now(),
            pingMs = pingMs,
            title = title.abbreviate(Database.MAX_TITLE_LENGTH),
            message = message?.abbreviate(Database.MAX_MESSAGE_LENGTH),
            timesRetried = timesRetried,
            previousStatus = context.previousCheckResult?.status ?: context.monitor.status,
        )
    }

    /**
     * Determines the new monitor status based on retry logic.
     */
    fun determineMonitorStatus(
        currentMonitorStatus: MonitorStatus,
        checkOutcome: CheckExecutionOutcome.Completed,
        retriesAllowed: Long,
        checkResultId: ULong,
    ): MonitorStatus {
        require(checkOutcome.status == MonitorStatus.DOWN || checkOutcome.status == MonitorStatus.UP)

        return when {
            checkOutcome.status == MonitorStatus.UP -> MonitorStatus.UP

            currentMonitorStatus == MonitorStatus.PENDING -> {
                logFirstCheckAfterBoot(checkResultId)
                MonitorStatus.DOWN
            }

            checkOutcome.timesRetried >= retriesAllowed -> {
                logRetriesExhausted(checkResultId, checkOutcome.timesRetried, retriesAllowed)
                MonitorStatus.DOWN
            }

            else -> {
                logRetriesRemaining(checkResultId, checkOutcome.timesRetried, retriesAllowed)
                MonitorStatus.UP // Keep UP until retries exhausted
            }
        }
    }

    private fun isPickedUpTooLate(createdAt: Instant, pickedUpAt: Instant): Boolean =
        pickedUpAt.minusSeconds(QUEUE_MONITOR_TIMEOUT_SECONDS).isAfter(createdAt)

    // Logging methods
    private fun logLatePickup(checkResult: CheckResultRecord, pickedUpAt: Instant) {
        checkResultLogEntryService.action(
            stage = CheckResultLogStage.SETUP,
            checkResultId = checkResult.id,
            message = "Job picked up in time",
            properties = mapOf(
                "result" to false.toString(),
                "time" to Duration.between(checkResult.createdAt, pickedUpAt).toMillis().toString(),
            ),
        )
        logger.error { "Monitor check '${checkResult.id}' was picked up too late" }
    }

    private fun logSkipped(checkResultId: ULong) {
        checkResultLogEntryService.action(
            stage = CheckResultLogStage.CHECK,
            checkResultId = checkResultId,
            message = "Monitor not paused or in maintenance",
            properties = mapOf("result" to false.toString()),
        )
    }

    private fun logCheckStarting(checkResultId: ULong) {
        // Job picked up in time log
        checkResultLogEntryService.action(
            stage = CheckResultLogStage.SETUP,
            checkResultId = checkResultId,
            message = "Job picked up in time",
            properties = mapOf("result" to true.toString()),
        )

        // Not paused log
        checkResultLogEntryService.action(
            stage = CheckResultLogStage.CHECK,
            checkResultId = checkResultId,
            message = "Monitor not paused or in maintenance",
            properties = mapOf("result" to true.toString()),
        )
    }

    private fun logCheckCompleted(checkResultId: ULong, pingMs: Long, isUp: Boolean) {
        checkResultLogEntryService.action(
            stage = CheckResultLogStage.CHECK,
            checkResultId = checkResultId,
            message = "Performing uptime check",
            properties = mapOf(
                "result" to isUp.toString(),
                "time" to pingMs.toString(),
            ),
        )
    }

    private fun logFirstCheckAfterBoot(checkResultId: ULong) {
        checkResultLogEntryService.info(
            stage = CheckResultLogStage.MONITOR_STATUS_UPDATE,
            checkResultId = checkResultId,
            message = "Previous monitor status is pending",
        )
    }

    private fun logRetriesExhausted(checkResultId: ULong, timesRetried: Long, retriesAllowed: Long) {
        checkResultLogEntryService.info(
            stage = CheckResultLogStage.MONITOR_STATUS_UPDATE,
            checkResultId = checkResultId,
            message = "Retry limit exceeded: $timesRetried attempt${
                if (timesRetried != 1L) "s" else ""
            } made, but the maximum allowed retries is $retriesAllowed",
        )
    }

    private fun logRetriesRemaining(checkResultId: ULong, timesRetried: Long, retriesAllowed: Long) {
        checkResultLogEntryService.info(
            stage = CheckResultLogStage.MONITOR_STATUS_UPDATE,
            checkResultId = checkResultId,
            message = "Retry limit not reached: $timesRetried attempt" +
                "${if (timesRetried != 1L) "s" else ""} (maximum allowed: $retriesAllowed)",
        )
    }
}
