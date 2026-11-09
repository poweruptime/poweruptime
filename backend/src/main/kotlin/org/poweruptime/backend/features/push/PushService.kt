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
                val stop = { synchronized(lifecycleLock) { container.stop() } }

                try {
                    synchronized(lifecycleLock) {
                        rabbitMQService.createPushExchangeAndQueue(teamId)
                        container.start()
                    }
                } catch (e: Exception) {
                    stop()
                    throw e
                }
                // Registered after start: if the subscription was cancelled meanwhile, this stops it immediately.
                emitter.onDispose { stop() }
            }.share()
    }

    fun newSubscription(teamIds: List<ULong>): Flux<String> {
        if (!pushEnabled) {
            return Flux.empty()
        }

        // Each team has one upstream listener, broadcast to all current SSE clients.
        // share() stops it after the last client leaves and recreates it on reconnection.
        return Flux
            .defer {
                Flux.merge(
                    teamIds.distinct().map { teamId ->
                        fluxByTeam.computeIfAbsent(teamId) { createTeamFlux(it) }
                    },
                )
            }
            // Buffer per client so a slow reader cannot stall the shared team listeners for everyone else.
            // On overflow the stream fails; the client reconnects and reloads its data.
            .onBackpressureBuffer(MAX_BUFFERED_PUSHES_PER_CLIENT) {
                logger.warn { "SSE client fell more than $MAX_BUFFERED_PUSHES_PER_CLIENT pushes behind; disconnecting" }
            }
    }

    fun send(teamId: ULong, dto: PushDto) {
        if (pushEnabled) {
            rabbitMQService.sendToPush(teamId, dto)
        }
    }
}
