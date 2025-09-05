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

const val ONE_SECOND_IN_MILLIS = 1000

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

    fun sendToProcessMonitor(checkResultId: ULong) = rabbitTemplate.convertAndSend(
        MONITOR_EXCHANGE,
        "",
        checkResultId.toString(),
    )

    fun sendToProcessSubNotification(subNotificationId: ULong) = rabbitTemplate.convertAndSend(
        NOTIFICATION_EXCHANGE,
        "",
        subNotificationId.toString(),
    )

    fun sendToPush(teamId: ULong, pushDto: PushDto) {
        createPushExchangeAndQueue(teamId)

        rabbitTemplate.convertAndSend(
            PUSH_EXCHANGE,
            rabbitMQConfiguration.getPushRoutingKey(teamId),
            pushDto,
        )
    }

    fun createPushExchangeAndQueue(teamId: ULong): String {
        val queueName = rabbitMQConfiguration.getPushQueueName(teamId)
        val routingKey = rabbitMQConfiguration.getPushRoutingKey(teamId)

        val queue = QueueBuilder.nonDurable(queueName).expires(ONE_SECOND_IN_MILLIS).build()

        rabbitAdmin.declareQueue(queue)
        val binding = BindingBuilder.bind(queue).to(rabbitMQConfiguration.pushDirectExchange()).with(routingKey)
        rabbitAdmin.declareBinding(binding)

        return queueName
    }
}
