package org.poweruptime.backend.features.mail.service

import io.github.oshai.kotlinlogging.KotlinLogging
import jakarta.mail.internet.MimeMessage
import org.poweruptime.backend.features.mail.EmailDto
import org.poweruptime.backend.features.mail.EmailSecurity
import org.poweruptime.backend.features.mail.EmailSender
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.JavaMailSenderImpl
import org.springframework.mail.javamail.MimeMessageHelper

class SendEmailService {
    private final val logger = KotlinLogging.logger {}

    private fun getJavaMailSender(emailSenderDto: EmailSender): JavaMailSender = JavaMailSenderImpl().apply {
        host = emailSenderDto.host
        port = emailSenderDto.port
        username = emailSenderDto.username
        password = emailSenderDto.password

        val props = javaMailProperties

        props["mail.smtp.auth"] = "true"
        props["mail.smtp.timeout"] = 5000
        props["mail.smtp.connectiontimeout"] = 5000
        props["mail.smtp.writetimeout"] = 5000

        when (emailSenderDto.security) {
            EmailSecurity.NONE_STARTTLS -> {
                props["mail.transport.protocol"] = "smtp"
                props["mail.smtp.starttls.enable"] = "true"
                if (!emailSenderDto.ignoreTLSErrors) {
                    props["mail.smtp.starttls.required"] = "true"
                }
            }
            EmailSecurity.TLS -> {
                props["mail.transport.protocol"] = "smtps"
                if (emailSenderDto.ignoreTLSErrors) {
                    props["mail.smtp.ssl.trust"] = "*"
                }
            }
        }

        javaMailProperties = props
    }

    fun send(emailSenderDto: EmailSender, emailDto: EmailDto) {
        val mailSender = getJavaMailSender(emailSenderDto)

        val mimeMessage: MimeMessage = mailSender.createMimeMessage()
        val helper = MimeMessageHelper(mimeMessage, true, "UTF-8")

        try {
            helper.setTo(emailDto.to.toTypedArray())
            helper.setSubject(emailDto.subject)
            helper.setFrom("poweruptime <${emailSenderDto.username}>")

            if (emailDto.html !== null) {
                helper.setText(emailDto.plain, emailDto.html)
            } else {
                helper.setText(emailDto.plain)
            }

            emailDto.cc?.let {
                helper.setCc(it.toTypedArray())
            }

            emailDto.bcc?.let {
                helper.setBcc(it.toTypedArray())
            }

            mailSender.send(mimeMessage)

            logger.info {
                "Email '${emailDto.subject}' from '${emailSenderDto.host}:${emailSenderDto.port}' sent to "
                "'${emailDto.to}'"
            }
        } catch (e: Throwable) {
            logger.error(e) {
                "Could not send email to '${emailDto.to}', subject: '${emailDto.subject}'"
            }
            throw e
        }
    }
}
