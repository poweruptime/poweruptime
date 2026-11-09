package org.poweruptime.backend.features.push

import org.poweruptime.backend.amqp.RabbitMQConfiguration
import org.poweruptime.backend.amqp.RabbitMQService
import org.poweruptime.backend.core.utils.Config
import org.poweruptime.backend.features.monitor.dto.PushDto
import org.springframework.amqp.core.AcknowledgeMode
import org.springframework.amqp.rabbit.connection.ConnectionFactory
import org.springframework.amqp.rabbit.listener.SimpleMessageListenerContainer
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import reactor.core.publisher.Flux
import reactor.core.publisher.FluxSink
import java.util.concurrent.ConcurrentHashMap

@Service
class PushService(
    @Value(Config.PUSH_ENABLED) private val pushEnabled: Boolean = false,
    private val connectionFactory: ConnectionFactory,
    private val rabbitMQService: RabbitMQService,
    private val rabbitMQConfiguration: RabbitMQConfiguration,
) {
    private val fluxByTeam = ConcurrentHashMap<ULong, Flux<String>>()

    private fun createTeamFlux(teamId: ULong): Flux<String> = Flux
        .create { emitter: FluxSink<String> ->
            rabbitMQService.createPushExchangeAndQueue(teamId)

            val container = SimpleMessageListenerContainer(connectionFactory).apply {
                setQueueNames(rabbitMQConfiguration.getPushQueueName(teamId))
                setConcurrentConsumers(1)
                acknowledgeMode = AcknowledgeMode.AUTO
                setMessageListener {
                    emitter.next(String(it.body))
                }
            }
            emitter.onDispose { container.stop() }
            container.start()
        }.share()

    fun newSubscription(teamIds: List<ULong>): Flux<String> {
        if (!pushEnabled) {
            return Flux.empty()
        }

        // Each team has one upstream listener, broadcast to all current SSE clients.
        // share() stops it after the last client leaves and recreates it on reconnection.
        return Flux.defer {
            Flux.merge(
                teamIds.distinct().map { teamId ->
                    fluxByTeam.computeIfAbsent(teamId) { createTeamFlux(it) }
                },
            )
        }
    }

    fun send(teamId: ULong, dto: PushDto) {
        if (pushEnabled) {
            rabbitMQService.sendToPush(teamId, dto)
        }
    }
}
