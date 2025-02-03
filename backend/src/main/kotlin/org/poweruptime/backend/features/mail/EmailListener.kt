package org.poweruptime.backend.features.mail

import org.poweruptime.backend.amqp.RabbitMQ.EMAIL_QUEUE
import org.poweruptime.backend.features.mail.service.SystemEmailService
import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.retry.annotation.Backoff
import org.springframework.retry.annotation.Retryable
import org.springframework.stereotype.Component

@Component
class EmailListener(
    private val systemEmailService: SystemEmailService
) {
    /**
     * Consumer for "email-queue"
     * Retry after 30 seconds, 1.5 minutes, 4.5 minutes and 10 minutes
     */
    @RabbitListener(queues = [EMAIL_QUEUE])
    @Retryable(
        value = [Exception::class],
        maxAttempts = 5,
        backoff = Backoff(delay = 30_000, multiplier = 3.0, maxDelay = 600_000),
    )
    fun mailQueueConsumer(dto: EmailDto) {
        systemEmailService.sendEmail(dto)
    }
}
