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
import java.util.concurrent.atomic.AtomicLong

@Service
class PushService(
    @Value(Config.PUSH_ENABLED) private val pushEnabled: Boolean = false,
    private val connectionFactory: ConnectionFactory,
    private val rabbitMQService: RabbitMQService,
    private val rabbitMQConfiguration: RabbitMQConfiguration,
) {
    private data class MessageListenerHolder(
        val refCount: AtomicLong,
        val flux: Flux<String>,
        val container: SimpleMessageListenerContainer,
    )

    private val holderByTeam = ConcurrentHashMap<ULong, MessageListenerHolder>()

    private fun createTeamFlux(teamId: ULong): MessageListenerHolder {
        rabbitMQService.createPushExchangeAndQueue(teamId)

        val container = SimpleMessageListenerContainer(connectionFactory).apply {
            setQueueNames(rabbitMQConfiguration.getPushQueueName(teamId))
            setConcurrentConsumers(1)
            acknowledgeMode = AcknowledgeMode.AUTO
        }

        // Keep running until all subscribers are gone:
        val decrementCount: () -> Unit = {
            val newCount = holderByTeam[teamId]?.refCount?.decrementAndGet()
            if (newCount != null && newCount <= 0) {
                container.stop()
                holderByTeam.remove(teamId)
            }
        }

        val flux = Flux
            .create { emitter: FluxSink<String> ->
                // Set up listener for each subscription
                container.setMessageListener {
                    if (!emitter.isCancelled) {
                        val message = String(it.body)
                        emitter.next(message)
                    }
                }

                container.start()

                emitter.onDispose { decrementCount() }
                emitter.onCancel { decrementCount() }
            }.doFinally {
                decrementCount()
            }

        return MessageListenerHolder(refCount = AtomicLong(0), flux = flux, container = container)
    }

    /**
     * Each call to getTeamFlux increments the reference count for the team's flux.
     */
    private fun getTeamFlux(teamId: ULong): Flux<String> {
        val holder = holderByTeam.computeIfAbsent(teamId) {
            createTeamFlux(teamId)
        }
        holder.refCount.incrementAndGet()
        return holder.flux
    }

    fun newSubscription(teamIds: List<ULong>): Flux<String> {
        if (!pushEnabled) {
            return Flux.empty()
        }

        return Flux.merge(teamIds.map { getTeamFlux(it) })
    }

    fun send(teamId: ULong, dto: PushDto) {
        if (pushEnabled) {
            rabbitMQService.sendToPush(teamId, dto)
        }
    }
}
