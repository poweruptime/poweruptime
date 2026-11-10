package org.poweruptime.backend.features.push

import io.github.oshai.kotlinlogging.KotlinLogging
import org.jetbrains.exposed.v1.core.Key
import org.jetbrains.exposed.v1.core.Transaction
import org.jetbrains.exposed.v1.core.statements.StatementInterceptor
import org.jetbrains.exposed.v1.jdbc.transactions.TransactionManager
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
import reactor.core.scheduler.Schedulers
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

    // Pushes of the current transaction, published once it commits.
    private val pendingPushesKey = Key<MutableList<Pair<ULong, PushDto>>>()

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
                    // Registered while holding the lock: if the subscription was cancelled meanwhile, the stop is
                    // scheduled before a replacement can start, and a replacement stops it itself first anyway.
                    // Stop asynchronously: cancellation can run on this listener's own thread (e.g. on overflow),
                    // where stop() would wait for itself until the shutdown timeout.
                    emitter.onDispose { Schedulers.boundedElastic().schedule { stop(container) } }
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

    /**
     * Publishes [dto] to the team's SSE clients. Inside a transaction it is published after the commit (and
     * dropped on rollback), because clients reload from the database and must see the pushed state.
     */
    fun send(teamId: ULong, dto: PushDto) {
        if (!pushEnabled) {
            return
        }

        val transaction = TransactionManager.currentOrNull()
        if (transaction == null) {
            publish(teamId, dto)
            return
        }

        val pending = transaction.getUserData(pendingPushesKey)
            ?: mutableListOf<Pair<ULong, PushDto>>().also { pushes ->
                transaction.putUserData(pendingPushesKey, pushes)
                transaction.registerInterceptor(
                    object : StatementInterceptor {
                        override fun afterCommit(transaction: Transaction) {
                            val committed = pushes.toList()
                            pushes.clear()
                            committed.forEach { (teamId, dto) -> publish(teamId, dto) }
                        }

                        override fun afterRollback(transaction: Transaction) = pushes.clear()
                    },
                )
            }
        pending += teamId to dto
    }

    private fun publish(teamId: ULong, dto: PushDto) {
        try {
            rabbitMQService.sendToPush(teamId, dto)
        } catch (e: Exception) {
            // Clients resync on reconnect and periodically; a lost push must not fail the committed work.
            logger.error(e) { "Failed to send push to team '$teamId'" }
        }
    }
}
