package org.poweruptime.backend.amqp

import org.springframework.amqp.core.Binding
import org.springframework.amqp.core.BindingBuilder
import org.springframework.amqp.core.FanoutExchange
import org.springframework.amqp.core.Queue
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class AMQPTestConfig {
    @Bean
    fun testQueue() = Queue(TestRabbit.TEST_QUEUE)

    @Bean
    fun testExchange() = FanoutExchange(TestRabbit.TEST_EXCHANGE)

    @Bean
    fun bindingCreateFile(): Binding = BindingBuilder.bind(testQueue()).to(testExchange())
}
