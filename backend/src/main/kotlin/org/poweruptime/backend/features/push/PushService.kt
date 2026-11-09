package org.poweruptime.backend.features.push

import io.github.oshai.kotlinlogging.KotlinLogging
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
import reactor.core.publisher.Sinks
import java.util.concurrent.ConcurrentHashMap

/** Pushes buffered per SSE client before it is disconnected and has to reconnect and reload. */
private const val MAX_BUFFERED_PUSHES_PER_CLIENT = 256

@Service
class PushService(
    @Value(Config.PUSH_ENABLED) private val pushEnabled: Boolean = false,
    private val connectionFactory: ConnectionFactory,
    private val rabbitMQService: RabbitMQService,
    private val rabbitMQConfiguration: RabbitMQConfiguration,
) {
    private val logger = KotlinLogging.logger {}

    // Entries are kept for the lifetime of the service: an idle entry holds no listener or queue, and keeping it
    // keeps the lifecycle lock stable across listener restarts.
    private val fluxByTeam = ConcurrentHashMap<ULong, Flux<String>>()

    private fun createTeamFlux(teamId: ULong): Flux<String> {
        // The queue is auto-deleted when its last consumer stops. Serialize stop and declare+start so a
        // replacement listener never declares the queue while the previous consumer can still delete it.
        val lifecycleLock = Any()

        // The listener of the latest connection, guarded by lifecycleLock.
        var running: SimpleMessageListenerContainer? = null
        val stop = { container: SimpleMessageListenerContainer ->
            synchronized(lifecycleLock) {
                container.stop()
                if (running === container) running = null
            }
        }

        return Flux
            .create { emitter: FluxSink<String> ->
                val container = SimpleMessageListenerContainer(connectionFactory).apply {
                    setQueueNames(rabbitMQConfiguration.getPushQueueName(teamId))
                    setConcurrentConsumers(1)
                    acknowledgeMode = AcknowledgeMode.AUTO
                    setMessageListener {
                        emitter.next(String(it.body))
                    }
                }

                synchronized(lifecycleLock) {
                    // share() only reconnects after the previous connection was cancelled, but its listener may
                    // not be stopped yet. Stop it first so it cannot consume (and ack) pushes nobody receives.
                    running?.let(stop)
                    try {
                        rabbitMQService.createPushExchangeAndQueue(teamId)
                        container.start()
                        running = container
                    } catch (e: Exception) {
                        stop(container)
                        throw e
                    }
                    // Registered while holding the lock: if the subscription was cancelled meanwhile, this stops
                    // the listener before a replacement can start.
                    emitter.onDispose { stop(container) }
                }
            }.share()
    }

    fun newSubscription(teamIds: List<ULong>): Flux<String> {
        if (!pushEnabled) {
            return Flux.empty()
        }

        // Each team has one upstream listener, broadcast to all current SSE clients.
        // share() stops it after the last client leaves and recreates it on reconnection.
        return Flux.defer {
            // Buffer per client so a slow reader cannot stall the shared team listeners for everyone else.
            // On overflow the stream fails right away (onBackpressureBuffer alone would only signal the error
            // after the backlog drained); the client reconnects and reloads its data.
            val overflow = Sinks.empty<String>()
            Flux
                .merge(
                    teamIds.distinct().map { teamId ->
                        fluxByTeam.computeIfAbsent(teamId) { createTeamFlux(it) }
                    },
                ).onBackpressureBuffer(MAX_BUFFERED_PUSHES_PER_CLIENT) {
                    logger.warn {
                        "SSE client fell more than $MAX_BUFFERED_PUSHES_PER_CLIENT pushes behind; disconnecting"
                    }
                    overflow.tryEmitError(IllegalStateException("SSE client buffer overflow"))
                }.mergeWith(overflow.asMono())
        }
    }

    fun send(teamId: ULong, dto: PushDto) {
        if (pushEnabled) {
            rabbitMQService.sendToPush(teamId, dto)
        }
    }
}
