package org.poweruptime.backend.amqp

object RabbitMQ {
    const val DEAD_LETTER_QUEUE = "dead-letter-queue"
    const val DEAD_LETTER_EXCHANGE = "dead-letter-exchange"
    const val EMAIL_QUEUE = "email-queue"
    const val EMAIL_EXCHANGE = "email-exchange"
    const val MONITOR_QUEUE = "monitor-queue"
    const val MONITOR_EXCHANGE = "monitor-exchange"
    const val NOTIFICATION_QUEUE = "notification-queue"
    const val NOTIFICATION_EXCHANGE = "notification-exchange"

    const val X_DEATH_FIRST_EXCHANGE = "x-first-death-exchange"
    const val X_DEATH_FIRST_QUEUE = "x-first-death-queue"
}
