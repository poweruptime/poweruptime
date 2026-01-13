package org.poweruptime.backend.features.notification

import io.github.oshai.kotlinlogging.KotlinLogging
import org.poweruptime.backend.configuration.toJSON
import org.poweruptime.backend.core.utils.Config
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.abbreviate
import org.poweruptime.backend.core.utils.emptyToNull
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.service.CheckResultService
import org.poweruptime.backend.features.notification.core.AppriseNotificationFormat
import org.poweruptime.backend.features.notification.core.AppriseNotificationRequest
import org.poweruptime.backend.features.notification.core.AppriseNotificationType
import org.poweruptime.backend.features.notification.core.NotificationMethodDataAppriseConverter
import org.poweruptime.backend.features.notification.core.NotificationMethodDataAppriseDto
import org.poweruptime.backend.features.notification.core.NotificationMethodTemplateType
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.dto.NotificationTemplate
import org.poweruptime.backend.features.notification.htmlConverter.HtmlConverterFactory
import org.poweruptime.backend.features.notification.model.SubNotificationJoinMethodAndNotificationRecord
import org.poweruptime.backend.features.notification.model.SubNotificationJoinMethodNotificationCheckResultAndMonitorRecord
import org.poweruptime.backend.features.notification.service.INotificationMethodDataService
import org.poweruptime.backend.features.notification.service.NotificationTemplateService
import org.poweruptime.backend.features.tempNotification.TempNotification
import org.poweruptime.backend.features.tempNotification.TempNotificationService
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.client.RestClient
import java.time.Instant

@Service
class AppriseSender(
    @Value(Config.NOTIFICATION_TEMP_ENABLED)
    private val tempNotificationsEnabled: Boolean = false,
    @Value(Config.APPRISE_URL)
    private val appriseUrl: String,
    private val restClient: RestClient,
    private val notificationMethodDataService: INotificationMethodDataService,
    private val notificationTemplateService: NotificationTemplateService,
    private val checkResultService: CheckResultService,
    private val tempNotificationService: TempNotificationService,
) {
    private val logger = KotlinLogging.logger {}

    @Transactional(readOnly = true)
    fun send(
        subNotificationJoin: SubNotificationJoinMethodNotificationCheckResultAndMonitorRecord,
    ): SubNotificationUpdate {
        val template = renderTemplate(subNotificationJoin)

        if (tempNotificationsEnabled) {
            return handleTempNotification(subNotificationJoin, template)
        }

        val appriseRequest = buildAppriseRequest(subNotificationJoin, template)
        val error = sendToApprise(appriseRequest)

        return if (error != null) {
            logger.error { "Apprise error: $error" }
            SubNotificationUpdate(
                title = template.title,
                message = template.body,
                error = error.abbreviate(Database.MAX_MESSAGE_LENGTH),
            )
        } else {
            SubNotificationUpdate(
                title = template.title,
                message = template.body,
                sentAt = Instant.now(),
            )
        }
    }

    private fun handleTempNotification(
        join: SubNotificationJoinMethodAndNotificationRecord,
        template: NotificationTemplate,
    ): SubNotificationUpdate {
        tempNotificationService.addNotification(
            TempNotification(
                to = join.method.type.name,
                subject = template.title,
                bodyHTML = template.body,
                appriseDto = buildAppriseRequest(join, template),
            ),
        )
        return SubNotificationUpdate(
            title = template.title,
            message = template.body,
            sentAt = Instant.now(),
        )
    }

    private fun buildAppriseRequest(
        join: SubNotificationJoinMethodAndNotificationRecord,
        template: NotificationTemplate,
    ): AppriseNotificationRequest {
        val method = join.method
        val appriseDto = NotificationMethodDataAppriseConverter
            .getByType(method.type)
            .convert(notificationMethodDataService.findByIdAndType(method.id, method.type))

        return AppriseNotificationRequest(
            urls = listOf(buildAppriseUrl(appriseDto, method.type)),
            title = template.title.emptyToNull(),
            body = convertBody(template.body, method.type),
            type = mapStatusToNotificationType(join.notification.status),
            format = mapFormatType(method.type.bodyType),
        )
    }

    private fun buildAppriseUrl(
        dto: NotificationMethodDataAppriseDto,
        type: NotificationMethodType,
    ): String = buildString {
        append(dto.url)
        append("?footer=no&image=no&format=${mapFormatType(type.bodyType).value}")
        dto.extras?.forEach { (k, v) -> append("&$k=$v") }
    }

    private fun convertBody(body: String, type: NotificationMethodType): String =
        HtmlConverterFactory()
            .getConverter(type.bodyType)
            .convert(body)

    private fun mapStatusToNotificationType(
        status: MonitorStatus,
    ): AppriseNotificationType = when (status) {
        MonitorStatus.UP -> AppriseNotificationType.INFO
        MonitorStatus.DOWN -> AppriseNotificationType.FAILURE
        else -> throw IllegalArgumentException("Invalid status: $status")
    }

    private fun mapFormatType(
        templateType: NotificationMethodTemplateType,
    ): AppriseNotificationFormat = when (templateType) {
        NotificationMethodTemplateType.PLAIN -> AppriseNotificationFormat.TEXT
        NotificationMethodTemplateType.HTML -> AppriseNotificationFormat.HTML
        NotificationMethodTemplateType.MARKDOWN,
        NotificationMethodTemplateType.MRKDWN -> AppriseNotificationFormat.MARKDOWN
    }

    private fun renderTemplate(
        join: SubNotificationJoinMethodNotificationCheckResultAndMonitorRecord,
    ): NotificationTemplate =
        notificationTemplateService.getRenderedNotification(
            join,
            previousOppositeCheckResult = checkResultService
                .getLastOppositeByMonitorIdAndStatus(
                    join.notification.monitorId,
                    join.notification.status,
                ),
        )

    private fun sendToApprise(request: AppriseNotificationRequest): String? = try {
        restClient.post()
            .uri("$appriseUrl/notify")
            .contentType(MediaType.APPLICATION_JSON)
            .body(request.toJSON())
            .retrieve()
            .toBodilessEntity()
        null
    } catch (e: Throwable) {
        e.message ?: "Unknown error"
    }
}
