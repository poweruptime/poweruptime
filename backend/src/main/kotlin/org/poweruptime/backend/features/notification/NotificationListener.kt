package org.poweruptime.backend.features.notification

import io.github.oshai.kotlinlogging.KotlinLogging
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.amqp.RabbitMQ.NOTIFICATION_QUEUE
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.abbreviate
import org.poweruptime.backend.features.monitor.dto.PushSubNotificationDto
import org.poweruptime.backend.features.monitor.model.CheckResultLogStage
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.service.CheckResultLogEntryService
import org.poweruptime.backend.features.notification.dto.SubNotificationResponse
import org.poweruptime.backend.features.notification.model.SubNotification
import org.poweruptime.backend.features.notification.model.SubNotificationJoinMethodAndNotificationRecord
import org.poweruptime.backend.features.notification.service.SubNotificationService
import org.poweruptime.backend.features.push.PushService
import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Duration
import java.time.Instant

private const val QUEUE_NOTIFICATION_TIMEOUT_SECONDS = 20L

@Component
class NotificationListener(
    private val subNotificationService: SubNotificationService,
    private val checkResultLogService: CheckResultLogEntryService,
    private val pushService: PushService,
    private val appriseSender: AppriseSender,
) {
    private val logger = KotlinLogging.logger {}

    @RabbitListener(queues = [NOTIFICATION_QUEUE])
    @Transactional
    fun notificationQueueConsumer(subNotificationId: String) {
        val join = subNotificationService.getByIdJoin(subNotificationId.toULong())

        try {
            validateNotification(join)

            val pickedUpAt = Instant.now()
            handleLatePickup(join, pickedUpAt)

            val update = appriseSender.send(join)
            applyUpdate(join, update)
            logSentResult(join, update)
            pushService.send(join.monitor.teamId, toPushDto(join, update))
        } catch (e: Throwable) {
            logger.error(e) { "Failed to send notification $subNotificationId" }
            applyErrorUpdate(join, e)
        }
    }

    private fun validateNotification(join: SubNotificationJoinMethodAndNotificationRecord) {
        require(join.notification.status in listOf(MonitorStatus.UP, MonitorStatus.DOWN)) {
            "Invalid status: ${join.notification.status}"
        }
    }

    private fun handleLatePickup(join: SubNotificationJoinMethodAndNotificationRecord, pickedUpAt: Instant) {
        val isLate = pickedUpAt
            .minusSeconds(QUEUE_NOTIFICATION_TIMEOUT_SECONDS)
            .isAfter(join.subNotification.createdAt)

        val duration = Duration
            .between(
                join.subNotification.createdAt,
                pickedUpAt,
            ).toMillis()

        checkResultLogService.action(
            stage = CheckResultLogStage.NOTIFICATION,
            checkResultId = join.notification.checkResultId,
            message = "${join.method.name} picked up in time",
            properties = mapOf(
                "result" to (!isLate).toString(),
                "time" to duration.toString(),
                "subNotificationId" to join.subNotification.publicId,
            ),
        )

        if (isLate) {
            error("Notification picked up too late")
        }
    }

    private fun applyUpdate(join: SubNotificationJoinMethodAndNotificationRecord, update: SubNotificationUpdate) {
        SubNotification.update({ SubNotification.id eq join.subNotification.id }) {
            update.title?.let { title -> it[SubNotification.title] = title }
            update.message?.let { message -> it[SubNotification.message] = message }
            update.error?.let { error -> it[SubNotification.error] = error }
            update.sentAt?.let { sentAt -> it[SubNotification.sentAt] = sentAt }
        }
    }

    private fun applyErrorUpdate(join: SubNotificationJoinMethodAndNotificationRecord, error: Throwable) {
        val message = (error.message ?: error.cause?.message ?: "Unknown error")
            .abbreviate(Database.MAX_MESSAGE_LENGTH)

        applyUpdate(join, SubNotificationUpdate(error = message))
    }

    private fun logSentResult(join: SubNotificationJoinMethodAndNotificationRecord, update: SubNotificationUpdate) {
        checkResultLogService.action(
            stage = CheckResultLogStage.NOTIFICATION,
            checkResultId = join.notification.checkResultId,
            message = "${join.method.name} sent",
            properties = mapOf(
                "result" to (update.error == null).toString(),
                "subNotificationId" to join.subNotification.publicId,
            ),
        )
    }

    private fun toPushDto(
        join: SubNotificationJoinMethodAndNotificationRecord,
        update: SubNotificationUpdate,
    ): PushSubNotificationDto = PushSubNotificationDto(
        subNotification = SubNotificationResponse(
            SubNotificationJoinMethodAndNotificationRecord(
                subNotification = join.subNotification.copy(
                    title = update.title ?: join.subNotification.title,
                    message = update.message ?: join.subNotification.message,
                    error = update.error,
                    sentAt = update.sentAt ?: join.subNotification.sentAt,
                ),
                method = join.method,
                notification = join.notification,
            ),
        ),
    )
}

data class SubNotificationUpdate(
    val title: String? = null,
    val message: String? = null,
    val error: String? = null,
    val sentAt: Instant? = null,
)
