package org.poweruptime.backend.interceptor

import org.poweruptime.backend.Routes
import org.poweruptime.backend.core.utils.Config
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.InterceptorRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
open class InterceptorConfiguration(
    @Value(Config.RATE_LIMIT_ENABLED) val rateLimitEnabled: Boolean,
    @Value(Config.HOST) val host: String,
    private val ipBasedRateLimitService: IPBasedRateLimitService,
    private val userIdBasedRateLimitService: UserIdBasedRateLimitService,
) : WebMvcConfigurer {

    @Suppress("SpreadOperator")
    override fun addInterceptors(registry: InterceptorRegistry) {
        if (rateLimitEnabled) {
            registry.addInterceptor(
                IPBasedRateLimitInterceptor(ipBasedRateLimitService),
            ).addPathPatterns(Routes.ipRateLimited)
            registry.addInterceptor(
                UserIdBasedRateLimitInterceptor(userIdBasedRateLimitService),
            ).addPathPatterns(Routes.userIdRateLimited)
        }
    }

    override fun addCorsMappings(registry: CorsRegistry) {
        registry.addMapping("/**")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH")
            .apply {
                if (host.startsWith("localhost")) {
                    allowedOriginPatterns("http://localhost:[*]") // Allow access from all ports on localhost
                } else {
                    allowedOrigins("https://$host")
                }
            }
    }
}
