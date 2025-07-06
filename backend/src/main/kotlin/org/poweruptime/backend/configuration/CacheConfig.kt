package org.poweruptime.backend.configuration

import com.github.benmanes.caffeine.cache.Caffeine
import org.springframework.cache.CacheManager
import org.springframework.cache.caffeine.CaffeineCache
import org.springframework.cache.support.SimpleCacheManager
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.util.concurrent.TimeUnit

const val JSON_INFO_CACHE_KEY = "JSON_INFO_CACHE"

@Configuration
class CacheConfig {

    @Bean
    fun cacheManager(): CacheManager {
        val caffeineCache = Caffeine.newBuilder()
            .expireAfterWrite(1, TimeUnit.MINUTES)
            .build<Any, Any>()

        val manager = SimpleCacheManager()
        manager.setCaches(
            listOf(
                CaffeineCache(JSON_INFO_CACHE_KEY, caffeineCache),
            ),
        )
        return manager
    }
}
