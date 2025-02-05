package org.poweruptime.backend.features.notification

import org.poweruptime.backend.amqp.RabbitMQ.NOTIFICATION_QUEUE
import org.poweruptime.backend.features.monitor.dto.PushNotificationDto
import org.poweruptime.backend.features.monitor.model.CheckResultLogStage
import org.poweruptime.backend.features.monitor.service.CheckResultLogEntryService
import org.poweruptime.backend.features.notification.core.NotificationSenderFactory
import org.poweruptime.backend.features.notification.dto.NotificationResponse
import org.poweruptime.backend.features.notification.model.Notification
import org.poweruptime.backend.features.notification.service.NotificationService
import org.poweruptime.backend.features.push.PushService
import org.slf4j.LoggerFactory
import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.stereotype.Component
import java.time.Duration
import java.time.Instant

private const val QUEUE_NOTIFICATION_TIMEOUT_SECONDS = 20L

@Component
class NotificationListener(
    private val notificationService: NotificationService,
    private val notificationSenderFactory: NotificationSenderFactory,
    private val checkResultLogEntryService: CheckResultLogEntryService,
    private val pushService: PushService,
) {
    private val logger = LoggerFactory.getLogger(NotificationListener::class.java)

    /**
     * Consumer for "notification-queue"
     */
    @RabbitListener(queues = [NOTIFICATION_QUEUE])
    fun notificationQueueConsumer(notificationId: String) {
        val notification = notificationService.getByIdOrThrow(notificationId)

        notification.pickedUpAt = Instant.now()

        logger.debug(
            """Received notification "{}" of type "{}" for monitor "{}"""",
            notification.id,
            notification.method.sender._type.name,
            notification.checkResult.monitor.name,
        )

        val isPickedUpTooLate = notification.pickedUpTooLate()

        checkResultLogEntryService.action(
            stage = CheckResultLogStage.NOTIFICATION,
            checkResult = notification.checkResult,
            message = """"${notification.method.name}" picked up in time""",
            properties = mapOf(
                "result" to (!isPickedUpTooLate).toString(),
                "time" to Duration.between(notification.createdAt, notification.pickedUpAt!!).toMillis().toString(),
                "notificationId" to notificationId,
            ),
        )

        if (isPickedUpTooLate) {
            logger.error(
                """Notification "{}" was picked up too late""",
                notification.id,
            )

            notification.error = "Notification picked up to late"

            notificationService.save(notification)

            return
        }

        notificationService.save(notificationSenderFactory.send(notification)).let {
            checkResultLogEntryService.action(
                stage = CheckResultLogStage.NOTIFICATION,
                checkResult = it.checkResult,
                message = """"${notification.method.name}" sent""",
                properties = mapOf(
                    "result" to (it.error == null).toString(),
                    "notificationId" to notificationId,
                ),
            )

            pushService.send(
                it.method.team.id,
                PushNotificationDto(notification = NotificationResponse(it)),
            )
        }
    }

    private fun Notification.pickedUpTooLate(): Boolean =
        Instant.now().minusSeconds(QUEUE_NOTIFICATION_TIMEOUT_SECONDS).isAfter(createdAt)
}
