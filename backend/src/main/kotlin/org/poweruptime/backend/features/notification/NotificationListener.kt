package org.poweruptime.backend.features.notification

import org.poweruptime.backend.amqp.RabbitMQ.NOTIFICATION_QUEUE
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.abbreviate
import org.poweruptime.backend.features.monitor.dto.PushSubNotificationDto
import org.poweruptime.backend.features.monitor.model.CheckResultLogStage
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.service.CheckResultLogEntryService
import org.poweruptime.backend.features.notification.dto.SubNotificationResponse
import org.poweruptime.backend.features.notification.model.SubNotification
import org.poweruptime.backend.features.notification.service.SubNotificationService
import org.poweruptime.backend.features.push.PushService
import org.slf4j.LoggerFactory
import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.stereotype.Component
import java.time.Duration
import java.time.Instant

private const val QUEUE_NOTIFICATION_TIMEOUT_SECONDS = 20L

@Component
class NotificationListener(
    private val subNotificationService: SubNotificationService,
    private val checkResultLogEntryService: CheckResultLogEntryService,
    private val pushService: PushService,
    private val appriseSender: AppriseSender,
) {
    private val logger = LoggerFactory.getLogger(NotificationListener::class.java)

    /**
     * Consumer for "notification-queue"
     */
    @Suppress("LongMethod")
    @RabbitListener(queues = [NOTIFICATION_QUEUE])
    fun notificationQueueConsumer(subNotificationId: String) {
        val subNotification = subNotificationService.getByIdOrThrow(subNotificationId)

        try {
            assert(
                listOf(
                    MonitorStatus.UP,
                    MonitorStatus.DOWN,
                ).contains(subNotification.notification.checkResult.status),
            )

            subNotification.pickedUpAt = Instant.now()

            logger.debug(
                """Received notification "{}" of type "{}" for monitor "{}"""",
                subNotification.id,
                subNotification.method.data._type.name,
                subNotification.notification.checkResult.monitor.name,
            )

            val isPickedUpTooLate = subNotification.pickedUpTooLate()

            checkResultLogEntryService.action(
                stage = CheckResultLogStage.NOTIFICATION,
                checkResult = subNotification.notification.checkResult,
                message = """"${subNotification.method.name}" picked up in time""",
                properties = mapOf(
                    "result" to (!isPickedUpTooLate).toString(),
                    "time" to Duration.between(
                        subNotification.createdAt,
                        subNotification.pickedUpAt!!,
                    ).toMillis().toString(),
                    "subNotificationId" to subNotificationId,
                ),
            )

            if (isPickedUpTooLate) {
                logger.error(
                    """Notification "{}" was picked up too late""",
                    subNotification.id,
                )

                subNotification.error = "Notification picked up to late"

                subNotificationService.save(subNotification)

                return
            }

            val sentSubNotification = appriseSender.send(subNotification)
            subNotificationService.save(sentSubNotification).let {
                checkResultLogEntryService.action(
                    stage = CheckResultLogStage.NOTIFICATION,
                    checkResult = it.notification.checkResult,
                    message = """"${subNotification.method.name}" sent""",
                    properties = mapOf(
                        "result" to (it.error == null).toString(),
                        "subNotificationId" to subNotificationId,
                    ),
                )

                pushService.send(
                    it.method.team.id,
                    PushSubNotificationDto(subNotification = SubNotificationResponse(it)),
                )
            }
        } catch (e: Throwable) {
            subNotification.error = (e.message ?: e.cause?.message ?: "Unknown error")
                .abbreviate(Database.MAX_MESSAGE_LENGTH)

            subNotificationService.save(subNotification)
        }
    }

    private fun SubNotification.pickedUpTooLate(): Boolean =
        Instant.now().minusSeconds(QUEUE_NOTIFICATION_TIMEOUT_SECONDS).isAfter(createdAt)
}
