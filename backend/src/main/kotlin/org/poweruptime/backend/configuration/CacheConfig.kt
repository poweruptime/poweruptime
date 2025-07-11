package org.poweruptime.backend.configuration

import com.github.benmanes.caffeine.cache.Caffeine
import org.springframework.cache.CacheManager
import org.springframework.cache.caffeine.CaffeineCache
import org.springframework.cache.support.SimpleCacheManager
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.util.concurrent.TimeUnit

const val JSON_INFO_CACHE_KEY = "JSON_INFO_CACHE"
const val MONITOR_ONE_DAY_CACHE_KEY = "MONITOR_ONE_DAY_CACHE"

@Configuration
class CacheConfig {

    @Bean
    fun cacheManager(): CacheManager {
        val jsonInfoCache = Caffeine.newBuilder()
            .expireAfterWrite(2, TimeUnit.MINUTES)
            .build<Any, Any>()

        val monitorOneDayUptimeCache = Caffeine.newBuilder()
            .expireAfterWrite(2, TimeUnit.MINUTES)
            .build<Any, Any>()

        val manager = SimpleCacheManager()
        manager.setCaches(
            listOf(
                CaffeineCache(JSON_INFO_CACHE_KEY, jsonInfoCache),
                CaffeineCache(MONITOR_ONE_DAY_CACHE_KEY, monitorOneDayUptimeCache),
            ),
        )
        return manager
    }
}
