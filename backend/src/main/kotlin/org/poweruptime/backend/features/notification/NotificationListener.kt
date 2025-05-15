package org.poweruptime.backend.features.notification

import com.vladsch.flexmark.html.HtmlRenderer
import com.vladsch.flexmark.html2md.converter.FlexmarkHtmlConverter
import com.vladsch.flexmark.util.data.MutableDataSet
import org.poweruptime.backend.amqp.RabbitMQ.NOTIFICATION_QUEUE
import org.poweruptime.backend.core.utils.Config
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.abbreviate
import org.poweruptime.backend.core.utils.emptyToNull
import org.poweruptime.backend.features.monitor.dto.PushSubNotificationDto
import org.poweruptime.backend.features.monitor.model.CheckResultLogStage
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.service.CheckResultLogEntryService
import org.poweruptime.backend.features.notification.core.AppriseNotificationRequest
import org.poweruptime.backend.features.notification.core.NotificationFormat
import org.poweruptime.backend.features.notification.core.NotificationMethodDataAppriseDto
import org.poweruptime.backend.features.notification.core.NotificationMethodDataConverter
import org.poweruptime.backend.features.notification.core.NotificationMethodDataType
import org.poweruptime.backend.features.notification.core.NotificationType
import org.poweruptime.backend.features.notification.dto.NotificationTemplate
import org.poweruptime.backend.features.notification.dto.SubNotificationResponse
import org.poweruptime.backend.features.notification.model.SubNotification
import org.poweruptime.backend.features.notification.service.NotificationTemplateService
import org.poweruptime.backend.features.notification.service.SubNotificationService
import org.poweruptime.backend.features.push.PushService
import org.poweruptime.backend.features.tempNotification.TempNotification
import org.poweruptime.backend.features.tempNotification.TempNotificationService
import org.slf4j.LoggerFactory
import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.stereotype.Component
import org.springframework.web.client.RestTemplate
import java.time.Duration
import java.time.Instant

private const val QUEUE_NOTIFICATION_TIMEOUT_SECONDS = 20L

@Component
class NotificationListener(
    @Value(Config.NOTIFICATION_TEMP_ENABLED) private val tempNotificationsEnabled: Boolean = false,
    @Value(Config.APPRISE_URL) private val appriseUrl: String,
    private val restTemplate: RestTemplate,
    private val subNotificationService: SubNotificationService,
    private val notificationMethodDataConverterFactory: NotificationMethodDataConverter,
    private val notificationTemplateService: NotificationTemplateService,
    private val checkResultLogEntryService: CheckResultLogEntryService,
    private val pushService: PushService,
    private val tempNotificationService: TempNotificationService,
) {
    private val logger = LoggerFactory.getLogger(NotificationListener::class.java)

    private val converter = FlexmarkHtmlConverter.builder(
        MutableDataSet().apply {
            // Ensure hard line breaks become "\n" in Markdown
            set(HtmlRenderer.SOFT_BREAK, "\n")
        },
    ).build()

    /**
     * Consumer for "notification-queue"
     */
    @RabbitListener(queues = [NOTIFICATION_QUEUE])
    fun notificationQueueConsumer(subNotificationId: String) {
        val subNotification = subNotificationService.getByIdOrThrow(subNotificationId)

        assert(listOf(MonitorStatus.UP, MonitorStatus.DOWN).contains(subNotification.notification.checkResult.status))

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

        subNotificationService.save(send(subNotification)).let {
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
    }

    private fun send(subNotification: SubNotification): SubNotification {
        val notificationTemplate = notificationTemplateService.getRenderedNotification(subNotification)
        subNotification.title = notificationTemplate.title
        subNotification.message = notificationTemplate.body

        val notificationMethodDataAppriseConverter = notificationMethodDataConverterFactory.converter(subNotification)

        val statelessNotificationRequest = getAppriseNotificationRequest(
            notificationMethodDataAppriseConverter.convert(subNotification.method.data),
            notificationTemplate,
            subNotification.method.data._type,
            subNotification.notification.checkResult.status,
        )

        if (tempNotificationsEnabled) {
            tempNotificationService.addNotification(
                TempNotification(
                    to = subNotification.method.data._type.name,
                    subject = notificationTemplate.title,
                    bodyHTML = notificationTemplate.body,
                    appriseDto = statelessNotificationRequest,
                ),
            )

            subNotification.sentAt = Instant.now()

            return subNotification
        }

        val result = sendToApprise(statelessNotificationRequest)

        if (result != null) {
            subNotification.error = result.abbreviate(Database.MAX_MESSAGE_LENGTH)
        } else {
            subNotification.sentAt = Instant.now()
        }

        return subNotification
    }

    private fun getAppriseNotificationRequest(
        notificationMethodDataAppriseDto: NotificationMethodDataAppriseDto,
        notificationTemplate: NotificationTemplate,
        notificationMethodDataType: NotificationMethodDataType,
        status: MonitorStatus
    ) = AppriseNotificationRequest(
        urls = listOf(
            "${notificationMethodDataAppriseDto.url}?footer=false&image=no&format=${
                if (notificationMethodDataType.markdown) NotificationFormat.MARKDOWN else NotificationFormat.HTML
            }${
                notificationMethodDataAppriseDto.extras
                    ?.map { (key, value) -> "$key=$value" }
                    ?.joinToString("&", "&")
                    ?: ""
            }",
        ),
        title = notificationTemplate.title.emptyToNull(),
        body = if (notificationMethodDataType.markdown) {
            converter.convert(
                notificationTemplate.body,
            )
        } else {
            notificationTemplate.body
        },
        type = when (status) {
            MonitorStatus.UP -> NotificationType.INFO
            MonitorStatus.DOWN -> NotificationType.FAILURE
            MonitorStatus.PENDING,
            MonitorStatus.MAINTENANCE,
            MonitorStatus.PAUSED -> throw IllegalArgumentException(
                "Status not allowed at this point: $status",
            )
        },
        format = if (notificationMethodDataType.markdown) NotificationFormat.MARKDOWN else NotificationFormat.HTML,
    )

    private fun sendToApprise(statelessNotificationRequest: AppriseNotificationRequest) = try {
        restTemplate.exchange(
            "$appriseUrl/notify",
            HttpMethod.POST,
            HttpEntity(
                statelessNotificationRequest,
                HttpHeaders().apply {
                    add("Accept", "*/*")
                    add("Content-Type", "application/json")
                },
            ),
            String::class.java,
        )
        null
    } catch (e: Throwable) {
        e.message ?: "Unknown error"
    }

    private fun SubNotification.pickedUpTooLate(): Boolean =
        Instant.now().minusSeconds(QUEUE_NOTIFICATION_TIMEOUT_SECONDS).isAfter(createdAt)
}
