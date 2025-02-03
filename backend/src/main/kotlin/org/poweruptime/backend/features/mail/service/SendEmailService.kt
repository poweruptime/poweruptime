package org.poweruptime.backend.features.mail.service

import jakarta.mail.internet.MimeMessage
import org.poweruptime.backend.features.mail.EmailDto
import org.poweruptime.backend.features.mail.EmailListener
import org.poweruptime.backend.features.mail.EmailSender
import org.slf4j.LoggerFactory
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.JavaMailSenderImpl
import org.springframework.mail.javamail.MimeMessageHelper

class SendEmailService {
    private val logger = LoggerFactory.getLogger(EmailListener::class.java)

    private fun getJavaMailSender(emailSenderDto: EmailSender): JavaMailSender = JavaMailSenderImpl().apply {
        host = emailSenderDto.host
        port = emailSenderDto.port
        username = emailSenderDto.username
        password = emailSenderDto.password

        val props = javaMailProperties
        props["mail.transport.protocol"] = "smtp"
        props["mail.smtp.auth"] = "true"
        props["mail.smtp.starttls.enable"] = "true"
        props["mail.smtp.timeout"] = 5000
        props["mail.smtp.connectiontimeout"] = 5000
        props["mail.smtp.writetimeout"] = 5000
        javaMailProperties = props
    }

    fun send(emailSenderDto: EmailSender, emailDto: EmailDto) {
        val mailSender = getJavaMailSender(emailSenderDto)

        val mimeMessage: MimeMessage = mailSender.createMimeMessage()
        val helper = MimeMessageHelper(mimeMessage, true, "UTF-8")

        try {
            helper.setTo(emailDto.to)
            helper.setSubject(emailDto.subject)
            if (emailDto.html !== null) {
                helper.setText(emailDto.plain, emailDto.html)
            } else {
                helper.setText(emailDto.plain)
            }
            helper.setFrom("poweruptime <${emailSenderDto.username}>")
            mailSender.send(mimeMessage)

            logger.info(
                """Email "{}" from "{}:{}" sent to "{}" """,
                emailDto.subject,
                emailSenderDto.host,
                emailSenderDto.port,
                emailDto.to,
            )
        } catch (e: Throwable) {
            logger.error("Could not send email to '${emailDto.to}', subject: '${emailDto.subject}'", e)
            throw e
        }
    }
}
