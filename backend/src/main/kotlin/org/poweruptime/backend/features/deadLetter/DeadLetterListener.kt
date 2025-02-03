package org.poweruptime.backend.features.deadLetter

import org.poweruptime.backend.amqp.RabbitMQ.DEAD_LETTER_QUEUE
import org.poweruptime.backend.amqp.RabbitMQ.X_DEATH_FIRST_EXCHANGE
import org.poweruptime.backend.amqp.RabbitMQ.X_DEATH_FIRST_QUEUE
import org.slf4j.LoggerFactory
import org.springframework.amqp.core.Message
import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.stereotype.Component

@Component
class DeadLetterListener(private val deadLetterRepository: DeadLetterRepository) {
    private val logger = LoggerFactory.getLogger(DeadLetterListener::class.java)

    /**
     * Consumer for "dead-letter-queue"
     */
    @RabbitListener(queues = [DEAD_LETTER_QUEUE])
    fun deadLetterQueueConsumer(dto: Message) {
        @Suppress("TooGenericExceptionCaught", "SwallowedException")
        val body = try {
            String(dto.body).lines().joinToString("")
        } catch (e: Throwable) {
            dto.body.toString()
        }

        val queue = dto.messageProperties.headers[X_DEATH_FIRST_QUEUE] as String
        val exchange = dto.messageProperties.headers[X_DEATH_FIRST_EXCHANGE] as String

        logger.error("""Received dead letter dto from queue: "{}" and exchange: "{}"""", queue, exchange)

        deadLetterRepository.save(DeadLetter(queue, exchange, body))
    }
}
