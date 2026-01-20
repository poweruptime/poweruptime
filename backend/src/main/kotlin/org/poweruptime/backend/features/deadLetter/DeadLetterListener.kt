package org.poweruptime.backend.features.deadLetter

import io.github.oshai.kotlinlogging.KotlinLogging
import org.jetbrains.exposed.v1.jdbc.insert
import org.poweruptime.backend.amqp.RabbitMQ.DEAD_LETTER_QUEUE
import org.poweruptime.backend.amqp.RabbitMQ.X_DEATH_FIRST_EXCHANGE
import org.poweruptime.backend.amqp.RabbitMQ.X_DEATH_FIRST_QUEUE
import org.springframework.amqp.core.Message
import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

@Component
class DeadLetterListener {
    private final val logger = KotlinLogging.logger {}

    /**
     * Consumer for "dead-letter-queue"
     */
    @RabbitListener(queues = [DEAD_LETTER_QUEUE])
    @Transactional
    fun deadLetterQueueConsumer(dto: Message) {
        @Suppress("SwallowedException")
        val body = try {
            String(dto.body).lines().joinToString("")
        } catch (_: Throwable) {
            dto.body.toString()
        }

        val queue = dto.messageProperties.headers[X_DEATH_FIRST_QUEUE] as String
        val exchange = dto.messageProperties.headers[X_DEATH_FIRST_EXCHANGE] as String

        logger.error {
            "Received dead letter dto from queue: '$queue' and exchange: '$exchange'"
        }

        DeadLetter.insert {
            it[DeadLetter.queue] = queue
            it[DeadLetter.exchange] = exchange
            it[DeadLetter.body] = body
        }
    }
}
