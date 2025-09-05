package org.poweruptime.backend.features.notification

import io.github.oshai.kotlinlogging.KotlinLogging
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.amqp.RabbitMQ.NOTIFICATION_QUEUE
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.abbreviate
import org.poweruptime.backend.features.monitor.dto.PushSubNotificationDto
import org.poweruptime.backend.features.monitor.model.CheckResultLogStage
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.service.CheckResultLogEntryService
import org.poweruptime.backend.features.notification.dto.SubNotificationResponse
import org.poweruptime.backend.features.notification.model.SubNotificationJoinMethodAndNotificationRecord
import org.poweruptime.backend.features.notification.model.SubNotificationRecord
import org.poweruptime.backend.features.notification.model.SubNotificationTable
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
    private val checkResultLogEntryService: CheckResultLogEntryService,
    private val pushService: PushService,
    private val appriseSender: AppriseSender,
) {
    private final val logger = KotlinLogging.logger {}

    /**
     * Consumer for "notification-queue"
     */
    @Suppress("LongMethod")
    @RabbitListener(queues = [NOTIFICATION_QUEUE])
    @Transactional
    fun notificationQueueConsumer(subNotificationId: String) {
        val subNotificationJoin = subNotificationService.getByIdJoin(subNotificationId.toULong())

        try {
            assert(
                listOf(
                    MonitorStatus.UP,
                    MonitorStatus.DOWN,
                ).contains(subNotificationJoin.checkResult.status),
            )

            subNotificationJoin.subNotification.pickedUpAt = Instant.now()

            logger.debug {
                "Received notification '${subNotificationJoin.subNotification.id}' of type " +
                    "'${subNotificationJoin.method.type.name}' for monitor " +
                    "'${subNotificationJoin.monitor.name}'"
            }

            val isPickedUpTooLate = subNotificationJoin.subNotification.pickedUpTooLate()

            checkResultLogEntryService.action(
                stage = CheckResultLogStage.NOTIFICATION,
                checkResultId = subNotificationJoin.checkResult.id,
                message = """"${subNotificationJoin.method.name}" picked up in time""",
                properties = mapOf(
                    "result" to (!isPickedUpTooLate).toString(),
                    "time" to Duration.between(
                        subNotificationJoin.subNotification.createdAt,
                        subNotificationJoin.subNotification.pickedUpAt!!,
                    ).toMillis().toString(),
                    "subNotificationId" to subNotificationId,
                ),
            )

            if (isPickedUpTooLate) {
                logger.error {
                    "Notification '${subNotificationJoin.subNotification.id}' was picked up too late"
                }

                SubNotificationTable.update({ SubNotificationTable.id eq subNotificationJoin.subNotification.id }) {
                    it[SubNotificationTable.error] = "Notification picked up to late"
                }

                return
            }

            val sentSubNotification = appriseSender.send(subNotificationJoin)

            SubNotificationTable.update({ SubNotificationTable.id eq subNotificationJoin.subNotification.id }) {
                it[SubNotificationTable.title] = sentSubNotification.title
                it[SubNotificationTable.message] = sentSubNotification.message
                it[SubNotificationTable.error] = sentSubNotification.error
                it[SubNotificationTable.sentAt] = sentSubNotification.sentAt
            }

            checkResultLogEntryService.action(
                stage = CheckResultLogStage.NOTIFICATION,
                checkResultId = subNotificationJoin.checkResult.id,
                message = """"${subNotificationJoin.method.name}" sent""",
                properties = mapOf(
                    "result" to (sentSubNotification.error == null).toString(),
                    "subNotificationId" to subNotificationId,
                ),
            )

            pushService.send(
                subNotificationJoin.monitor.teamId,
                PushSubNotificationDto(
                    subNotification = SubNotificationResponse(
                        SubNotificationJoinMethodAndNotificationRecord(
                            subNotification = sentSubNotification,
                            method = subNotificationJoin.method,
                            notification = subNotificationJoin.notification,
                        ),
                    ),
                ),
            )
        } catch (e: Throwable) {
            SubNotificationTable.update({ SubNotificationTable.id eq subNotificationJoin.subNotification.id }) {
                it[SubNotificationTable.error] = (e.message ?: e.cause?.message ?: "Unknown error")
                    .abbreviate(Database.MAX_MESSAGE_LENGTH)
            }
        }
    }

    private fun SubNotificationRecord.pickedUpTooLate(): Boolean =
        Instant.now().minusSeconds(QUEUE_NOTIFICATION_TIMEOUT_SECONDS).isAfter(createdAt)
}
