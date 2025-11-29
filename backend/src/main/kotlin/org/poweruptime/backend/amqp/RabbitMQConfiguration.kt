package org.poweruptime.backend.amqp

import org.poweruptime.backend.amqp.RabbitMQ.DEAD_LETTER_EXCHANGE
import org.poweruptime.backend.amqp.RabbitMQ.DEAD_LETTER_QUEUE
import org.poweruptime.backend.amqp.RabbitMQ.EMAIL_EXCHANGE
import org.poweruptime.backend.amqp.RabbitMQ.EMAIL_QUEUE
import org.poweruptime.backend.amqp.RabbitMQ.MONITOR_EXCHANGE
import org.poweruptime.backend.amqp.RabbitMQ.MONITOR_QUEUE
import org.poweruptime.backend.amqp.RabbitMQ.NOTIFICATION_EXCHANGE
import org.poweruptime.backend.amqp.RabbitMQ.NOTIFICATION_QUEUE
import org.poweruptime.backend.amqp.RabbitMQ.PUSH_EXCHANGE
import org.springframework.amqp.core.*
import org.springframework.amqp.rabbit.connection.ConnectionFactory
import org.springframework.amqp.rabbit.core.RabbitAdmin
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import tools.jackson.databind.json.JsonMapper

@Configuration
@Suppress("TooManyFunctions")
class RabbitMQConfiguration {

    @Bean
    fun rabbitTemplate(
        connectionFactory: ConnectionFactory,
        producerJacksonJsonMessageConverter: JacksonJsonMessageConverter
    ): RabbitTemplate {
        val rabbitTemplate = RabbitTemplate(connectionFactory)
        rabbitTemplate.messageConverter = producerJacksonJsonMessageConverter
        return rabbitTemplate
    }

    @Bean
    fun rabbitAdmin(connectionFactory: ConnectionFactory) = RabbitAdmin(connectionFactory)

    @Bean
    fun producerJacksonJsonMessageConverter(
        jsonMapper: JsonMapper
    ): JacksonJsonMessageConverter = JacksonJsonMessageConverter(jsonMapper)

    // DEAD LETTER
    @Bean
    fun deadLetterQueue() = Queue(DEAD_LETTER_QUEUE, true)

    @Bean
    fun deadLetterExchange() = FanoutExchange(DEAD_LETTER_EXCHANGE, true, false)

    @Bean
    fun deadLetterBinding(): Binding = BindingBuilder.bind(deadLetterQueue()).to(deadLetterExchange())

    // EMAIL
    @Bean
    fun emailQueue(): Queue = QueueBuilder.durable(EMAIL_QUEUE)
        .deadLetterExchange(DEAD_LETTER_EXCHANGE)
        .build()

    @Bean
    fun emailExchange() = FanoutExchange(EMAIL_EXCHANGE, true, false)

    @Bean
    fun emailBinding(): Binding = BindingBuilder.bind(emailQueue()).to(emailExchange())

    // MONITOR
    @Bean
    fun monitorQueue() = Queue(MONITOR_QUEUE, true)

    // Set durable to false as we probably don't want to process Jobs created before a shutdown
    @Bean
    fun monitorExchange() = FanoutExchange(MONITOR_EXCHANGE, false, false)

    @Bean
    fun monitorBinding(): Binding = BindingBuilder.bind(monitorQueue()).to(monitorExchange())

    // NOTIFICATION
    @Bean
    fun notificationQueue() = Queue(NOTIFICATION_QUEUE, true)

    @Bean
    fun notificationExchange() = FanoutExchange(NOTIFICATION_EXCHANGE, true, false)

    @Bean
    fun notificationBinding(): Binding = BindingBuilder.bind(notificationQueue()).to(notificationExchange())

    // PUSH NOTIFICATIONS
    fun getPushQueueName(teamId: ULong) = "push-$teamId-queue"

    fun getPushRoutingKey(teamId: ULong) = "push-$teamId"

    /**
     * An exchange which assigns the messages based on a routing key
     * The routing key is the id of the team
     * Only active connections consume the queue
     */
    @Bean
    fun pushDirectExchange() = DirectExchange(PUSH_EXCHANGE, false, false)
}
