package org.poweruptime.backend.amqp

import org.poweruptime.backend.amqp.RabbitMQ.EMAIL_EXCHANGE
import org.poweruptime.backend.amqp.RabbitMQ.MONITOR_EXCHANGE
import org.poweruptime.backend.amqp.RabbitMQ.NOTIFICATION_EXCHANGE
import org.poweruptime.backend.amqp.RabbitMQ.PUSH_EXCHANGE
import org.poweruptime.backend.features.mail.EmailDto
import org.poweruptime.backend.features.monitor.dto.PushDto
import org.springframework.amqp.core.BindingBuilder
import org.springframework.amqp.core.QueueBuilder
import org.springframework.amqp.rabbit.core.RabbitAdmin
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.stereotype.Service

@Service
class RabbitMQService(
    private val rabbitTemplate: RabbitTemplate,
    private val rabbitAdmin: RabbitAdmin,
    private val rabbitMQConfiguration: RabbitMQConfiguration,
) {
    fun sendToSendSystemEmail(emailDto: EmailDto) = rabbitTemplate.convertAndSend(
        EMAIL_EXCHANGE,
        "",
        emailDto,
    )

    fun sendToProcessMonitor(monitorId: String) = rabbitTemplate.convertAndSend(
        MONITOR_EXCHANGE,
        "",
        monitorId,
    )

    fun sendToProcessNotification(notificationId: String) = rabbitTemplate.convertAndSend(
        NOTIFICATION_EXCHANGE,
        "",
        notificationId,
    )

    fun sendToPush(teamId: String, pushDto: PushDto) {
        createPushExchangeAndQueue(teamId)

        rabbitTemplate.convertAndSend(
            PUSH_EXCHANGE,
            rabbitMQConfiguration.getPushRoutingKey(teamId),
            pushDto,
        )
    }

    fun createPushExchangeAndQueue(teamId: String): String {
        val queueName = rabbitMQConfiguration.getPushQueueName(teamId)
        val routingKey = rabbitMQConfiguration.getPushRoutingKey(teamId)

        val queue = QueueBuilder.nonDurable(queueName).expires(1_000).build()

        rabbitAdmin.declareQueue(queue)
        val binding = BindingBuilder.bind(queue).to(rabbitMQConfiguration.pushDirectExchange()).with(routingKey)
        rabbitAdmin.declareBinding(binding)

        return queueName
    }
}
