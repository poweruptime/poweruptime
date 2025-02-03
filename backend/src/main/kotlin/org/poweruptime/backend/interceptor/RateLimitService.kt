package org.poweruptime.backend.interceptor

import io.github.bucket4j.BandwidthBuilder
import io.github.bucket4j.Bucket
import io.github.bucket4j.local.LocalBucketBuilder
import org.poweruptime.backend.core.utils.Config
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.time.Duration
import java.util.concurrent.ConcurrentHashMap
import kotlin.math.ceil
import kotlin.math.roundToLong

@Service
class RateLimitService(
    @Value(Config.RATE_LIMIT_TRIES) val rateLimitTries: Long,
    @Value(Config.RATE_LIMIT_DURATION_IN_SECONDS) val rateLimitDurationInSeconds: Long,
) {
    private val cache: MutableMap<String, Bucket> = ConcurrentHashMap()

    fun resolveBucket(ipAddress: String) = cache.computeIfAbsent(ipAddress) {
        newBucket()
    }

    private fun newBucket() = LocalBucketBuilder()
        .addLimit(
            BandwidthBuilder.builder().capacity(rateLimitTries).refillIntervally(
                1,
                Duration.ofSeconds(
                    // round upwards
                    ceil(rateLimitDurationInSeconds.toDouble() / rateLimitTries.toDouble()).roundToLong(),
                ),
            ).build(),
        )
        .build()
}
