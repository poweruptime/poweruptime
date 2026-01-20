package org.poweruptime.backend.amqp

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.poweruptime.backend.core.BaseTestWithReusingContainers
import org.springframework.amqp.core.Message
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.beans.factory.annotation.Autowired
import org.testcontainers.junit.jupiter.Testcontainers

@Testcontainers
class GeneralRabbitMQTest : BaseTestWithReusingContainers() {
    @Autowired
    lateinit var rabbitTemplate: RabbitTemplate

    @Test
    fun `general Rabbit Test`() {
        val messageBody = "Hello world!"
        rabbitTemplate.convertAndSend(TestRabbit.TEST_EXCHANGE, "test.key1", messageBody)

        val message: Message? = rabbitTemplate.receive(TestRabbit.TEST_QUEUE)

        assertThat(message).isNotNull
        val receivedMessage = message!!
            .body
            .decodeToString()
            .removePrefix("\"")
            .removeSuffix("\"")
        assertThat(receivedMessage).isEqualTo(messageBody)
    }
}
