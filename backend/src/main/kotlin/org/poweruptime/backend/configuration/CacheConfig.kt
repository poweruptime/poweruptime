package org.poweruptime.backend.configuration

import com.github.benmanes.caffeine.cache.Caffeine
import org.springframework.cache.CacheManager
import org.springframework.cache.caffeine.CaffeineCache
import org.springframework.cache.support.SimpleCacheManager
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.util.concurrent.TimeUnit

const val MONITOR_RECENT_UPTIME_CACHE_KEY = "MONITOR_RECENT_UPTIME_CACHE"
const val MONITOR_UPTIME_STATISTICS_CACHE_KEY = "MONITOR_UPTIME_STATISTICS_CACHE"
const val MONITOR_YEARLY_UPTIME_CACHE_KEY = "MONITOR_YEARLY_UPTIME_CACHE"

@Configuration
class CacheConfig {

    @Bean
    fun cacheManager(): CacheManager = SimpleCacheManager().apply {
        setCaches(
            listOf(
                CaffeineCache(
                    MONITOR_RECENT_UPTIME_CACHE_KEY,
                    Caffeine.newBuilder()
                        .expireAfterWrite(5, TimeUnit.MINUTES)
                        .build(),
                ),
                CaffeineCache(
                    MONITOR_UPTIME_STATISTICS_CACHE_KEY,
                    Caffeine.newBuilder()
                        .expireAfterWrite(5, TimeUnit.MINUTES)
                        .build(),
                ),
                CaffeineCache(
                    MONITOR_YEARLY_UPTIME_CACHE_KEY,
                    Caffeine.newBuilder()
                        .expireAfterWrite(5, TimeUnit.MINUTES)
                        .build(),
                ),
            ),
        )
    }
}
