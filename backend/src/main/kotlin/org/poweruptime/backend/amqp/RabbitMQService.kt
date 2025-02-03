package org.poweruptime.backend.amqp

import org.poweruptime.backend.features.mail.EmailDto
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.stereotype.Service

@Service
class RabbitMQService(
    private val rabbitTemplate: RabbitTemplate,
) {
    fun sendToSendSystemEmail(emailDto: EmailDto) {
        rabbitTemplate.convertAndSend(
            RabbitMQ.EMAIL_EXCHANGE,
            "",
            emailDto,
        )
    }

    fun sendToProcessMonitor(monitorId: String) {
        rabbitTemplate.convertAndSend(
            RabbitMQ.MONITOR_EXCHANGE,
            "",
            monitorId,
        )
    }

    fun sendToProcessNotification(notificationId: String) {
        rabbitTemplate.convertAndSend(
            RabbitMQ.NOTIFICATION_EXCHANGE,
            "",
            notificationId,
        )
    }
}
