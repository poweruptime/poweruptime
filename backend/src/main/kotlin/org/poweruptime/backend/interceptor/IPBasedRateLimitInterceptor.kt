package org.poweruptime.backend.interceptor

import io.github.oshai.kotlinlogging.KotlinLogging
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.poweruptime.backend.core.resource.CustomHttpHeader
import org.springframework.http.HttpStatus
import org.springframework.web.servlet.HandlerInterceptor
import java.util.concurrent.TimeUnit

class IPBasedRateLimitInterceptor(private val ipBasedRateLimitService: IPBasedRateLimitService) : HandlerInterceptor {
    private final val logger = KotlinLogging.logger {}

    @Throws(Exception::class)
    override fun preHandle(request: HttpServletRequest, response: HttpServletResponse, handler: Any): Boolean {
        val ipAddress = request.remoteAddr

        val probe = ipBasedRateLimitService.resolveBucket(ipAddress).tryConsumeAndReturnRemaining(1)
        return if (probe.isConsumed) {
            val remainingTokens = probe.remainingTokens.toString()
            response.addHeader(CustomHttpHeader.RATE_LIMIT_REMAINING, remainingTokens)
            logger.info { "RateLimit success for '$ipAddress' with $remainingTokens remaining tokens" }
            true
        } else {
            val waitForRefill = TimeUnit.NANOSECONDS.toSeconds(probe.nanosToWaitForRefill).toString()
            response.addHeader(CustomHttpHeader.RATE_LIMIT_RETRY_AFTER_SECONDS, waitForRefill)
            logger.info { "RateLimit fail for '$ipAddress'. Retry after $waitForRefill seconds" }
            response.sendError(HttpStatus.TOO_MANY_REQUESTS.value())
            false
        }
    }
}
