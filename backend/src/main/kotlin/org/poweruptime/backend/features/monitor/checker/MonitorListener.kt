package org.poweruptime.backend.features.monitor.checker

import io.github.oshai.kotlinlogging.KotlinLogging
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.poweruptime.backend.amqp.RabbitMQ.MONITOR_QUEUE
import org.poweruptime.backend.features.monitor.model.CheckResultLogStage
import org.poweruptime.backend.features.monitor.model.CheckResultRecord
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.service.CheckResultLogEntryService
import org.poweruptime.backend.features.monitor.service.CheckResultService
import org.poweruptime.backend.features.monitor.service.CheckResultStatisticsService
import org.poweruptime.backend.features.monitor.service.MonitorService
import org.poweruptime.backend.features.notification.service.SubNotificationService
import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.stereotype.Component

private const val MONITOR_DEFAULT_RETRY = 1L

@Component
class MonitorListener(
    private val executor: MonitorCheckExecutor,
    private val persister: MonitorCheckPersister,
    private val notificationHandler: MonitorNotificationHandler,
    private val checkResultService: CheckResultService,
    private val checkResultStatisticsService: CheckResultStatisticsService,
    private val checkResultLogEntryService: CheckResultLogEntryService,
    private val monitorService: MonitorService,
    private val subNotificationService: SubNotificationService,
) {
    private val logger = KotlinLogging.logger {}

    /**
     * Receives messages from "monitor-queue" and processes [CheckResultRecord] by ID.
     */
    @RabbitListener(queues = [MONITOR_QUEUE])
    fun monitorQueueConsumer(checkResultIdStr: String) {
        val checkResultId = checkResultIdStr.toULong()

        // Transaction: Execute check, persist results, create notifications
        val subNotifications = transaction {
            val (checkResult, context) = loadContext(checkResultId)

            logger.debug { "Received monitor check '$checkResultId' of monitor '${context.monitor.name}'" }

            // 1. Execute check (pure logic)
            val outcome = executor.execute(checkResult, context)

            // 2. Persist check result
            val savedCheckResult = persister.saveCheckResult(checkResultId, outcome)

            // 3. Determine and persist new monitor status
            val (updatedMonitor, oldStatus) = updateMonitorStatus(context.monitor, outcome, checkResultId)

            // 4. Send push notifications
            notificationHandler.sendCheckResultPush(savedCheckResult, updatedMonitor, context.team)
            notificationHandler.sendMonitorStatusPushIfChanged(updatedMonitor, context.team, oldStatus)

            // 5. Create notifications if needed
            val subs = notificationHandler.handleNotifications(
                updatedMonitor,
                savedCheckResult,
                context.team,
                oldStatus,
                context,
            )

            subs.also { commit() }
        }

        // Queue sub-notifications (outside transaction)
        subNotifications?.forEach { subNotificationJoin ->
            subNotificationService.queueNotification(subNotificationJoin.subNotification.id)

            checkResultLogEntryService.info(
                stage = CheckResultLogStage.NOTIFICATION,
                checkResultId = checkResultId,
                message = """Queued "${subNotificationJoin.method.name}" notification""",
                properties = mapOf("subNotificationId" to subNotificationJoin.subNotification.publicId),
            )
        }
    }

    private fun loadContext(checkResultId: ULong): Pair<CheckResultRecord, MonitorCheckContext> {
        val joinRecord = checkResultService.getByIdJoinMonitorAndTeam(checkResultId)

        val previousCheck = checkResultStatisticsService
            .getLastByMonitorId(joinRecord.monitor.id, 2)
            .firstOrNull { it.id != checkResultId }

        val context = MonitorCheckContext(
            checkResultId = checkResultId,
            monitor = joinRecord.monitor,
            team = joinRecord.team,
            previousCheckResult = previousCheck,
        )

        return Pair(joinRecord.checkResult, context)
    }

    private fun updateMonitorStatus(
        monitor: MonitorRecord,
        outcome: CheckExecutionOutcome,
        checkResultId: ULong,
    ): Pair<MonitorRecord, MonitorStatus> {
        val oldStatus = monitor.status

        // Only update for completed checks that can change monitor status
        if (outcome !is CheckExecutionOutcome.Completed) {
            return Pair(monitor, oldStatus)
        }

//        if (outcome.status !in listOf(MonitorStatus.UP, MonitorStatus.DOWN)) {
//            logger.info {
//                "Monitor '${monitor.name}' is paused or in maintenance, status: '${outcome.status}', " +
//                    "not processing status change"
//            }
//            return Pair(monitor, oldStatus)
//        }

        val newStatus = executor.determineMonitorStatus(
            monitor.status,
            outcome,
            monitor.retries ?: MONITOR_DEFAULT_RETRY,
            checkResultId,
        )

        // Only persist if status actually changed
        if (newStatus != monitor.status) {
            val updated = persister.updateMonitorStatus(monitor.id, newStatus)

            val finalMonitor = if (updated) {
                monitorService.getById(monitor.id)
            } else {
                logger.warn {
                    "Monitor '${monitor.name}', was updated after receiving it for processing. " +
                        "Could not persist to db. Continuing with not-persisted monitor"
                }
                monitor
            }

            checkResultLogEntryService.action(
                stage = CheckResultLogStage.MONITOR_STATUS_UPDATE,
                checkResultId = checkResultId,
                message = "Monitor updated to ${finalMonitor.status.name.uppercase()}",
                properties = mapOf("result" to updated.toString()),
            )

            return Pair(finalMonitor, oldStatus)
        }

        return Pair(monitor, oldStatus)
    }
}
