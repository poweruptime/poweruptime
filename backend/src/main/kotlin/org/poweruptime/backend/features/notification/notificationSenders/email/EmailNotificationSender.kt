package org.poweruptime.backend.features.notification.notificationSenders.email

import org.poweruptime.backend.features.mail.EmailDto
import org.poweruptime.backend.features.mail.emails.EmailNotificationEmail
import org.poweruptime.backend.features.mail.service.EmailTemplateService
import org.poweruptime.backend.features.mail.service.SendEmailService
import org.poweruptime.backend.features.notification.core.NotificationSender
import org.poweruptime.backend.features.notification.core.NotificationSenderType
import org.poweruptime.backend.features.notification.dto.NotificationTemplate
import org.poweruptime.backend.features.notification.model.NotificationMethod

class EmailNotificationSender(
    val emailTemplateService: EmailTemplateService,
    override val type: NotificationSenderType = NotificationSenderType.EMAIL,
) : NotificationSender {
    private val emailSender = SendEmailService()

    override fun send(
        notificationMethod: NotificationMethod,
        notificationTemplate: NotificationTemplate
    ): String? = try {
        val emailNotificationMethodData = notificationMethod.sender as EmailNotificationSenderData
        val email = EmailNotificationEmail(
            to = emailNotificationMethodData.to,
            title = notificationTemplate.title,
            body = notificationTemplate.body,
            cc = emailNotificationMethodData.cc,
            bcc = emailNotificationMethodData.bcc,
        )
        emailSender.send(
            emailNotificationMethodData,
            EmailDto(
                email = email,
                template = emailTemplateService.getRenderedMail(email),
            ),
        )
        null
    } catch (e: Throwable) {
        e.message ?: "Unknown error"
    }
}
