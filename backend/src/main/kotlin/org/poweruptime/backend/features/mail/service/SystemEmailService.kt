package org.poweruptime.backend.features.mail.service

import org.poweruptime.backend.amqp.RabbitMQService
import org.poweruptime.backend.core.utils.*
import org.poweruptime.backend.features.mail.Email
import org.poweruptime.backend.features.mail.EmailDto
import org.poweruptime.backend.features.mail.EmailListener
import org.poweruptime.backend.features.mail.EmailSecurity
import org.poweruptime.backend.features.mail.EmailSenderDto
import org.poweruptime.backend.features.tempNotification.TempNotification
import org.poweruptime.backend.features.tempNotification.TempNotificationService
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

@Service
class SystemEmailService(
    @Value(Config.NOTIFICATION_TEMP_ENABLED) private val tempNotificationsEnabled: Boolean = false,
    @Value(Config.MAIL_ENABLED) private val mailEnabled: Boolean = false,
    @Value(Config.MAIL_HOST) private val mailHost: String,
    @Value(Config.MAIL_PORT) private val mailPort: Int,
    @Value(Config.MAIL_USERNAME) private val mailUsername: String,
    @Value(Config.MAIL_PASSWORD) private val mailPassword: String,
    @Value(Config.MAIL_SECURITY) private val mailSecurity: String,
    @Value(Config.MAIL_IGNORE_TLS_ERRORS) private val mailIgnoreTLSErrors: Boolean,
    private val tempNotificationService: TempNotificationService,
    private val emailTemplateService: EmailTemplateService,
    private val rabbitMQService: RabbitMQService
) {
    private val logger = LoggerFactory.getLogger(EmailListener::class.java)

    private val systemSendEmailService = SendEmailService()
    private val systemEmailSenderDto = EmailSenderDto(
        host = mailHost,
        port = mailPort,
        username = mailUsername,
        password = mailPassword,
        security = EmailSecurity.valueOf(mailSecurity),
        ignoreTLSErrors = mailIgnoreTLSErrors,
    )

    fun sendEmail(dto: EmailDto) {
        logger.info("Received email to process; to '${dto.to}', subject: '${dto.subject}'")

        if (tempNotificationsEnabled) {
            tempNotificationService.addNotification(
                TempNotification(
                    to = dto.to.joinToString(),
                    subject = dto.subject,
                    body = dto.plain,
                    bodyHTML = dto.html,
                ),
            )

            logger.debug("Saved email to temporary notification; to '${dto.to}', subject: '${dto.subject}'")
        }

        if (!mailEnabled) {
            logger.warn("System Email sending disabled")
            return
        }

        systemSendEmailService.send(emailSenderDto = systemEmailSenderDto, emailDto = dto)
    }

    fun sendEmail(email: Email): Unit = sendEmail(
        EmailDto(
            email = email,
            template = emailTemplateService.getRenderedMail(email),
        ),
    )

    fun queueEmail(email: Email) {
        logger.debug("Queued system email '${email.to}', subject: '${email.subject}'")

        rabbitMQService.sendToSendSystemEmail(
            EmailDto(
                email = email,
                template = emailTemplateService.getRenderedMail(email),
            ),
        )
    }
}
