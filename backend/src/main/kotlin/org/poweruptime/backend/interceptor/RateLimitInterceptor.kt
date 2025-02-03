package org.poweruptime.backend.interceptor

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.poweruptime.backend.core.resource.CustomHttpHeader
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.web.servlet.HandlerInterceptor
import java.util.concurrent.TimeUnit

class RateLimitInterceptor(private val rateLimitService: RateLimitService) : HandlerInterceptor {
    private val log = LoggerFactory.getLogger(RateLimitInterceptor::class.java)

    @Throws(Exception::class)
    override fun preHandle(request: HttpServletRequest, response: HttpServletResponse, handler: Any): Boolean {
        val ipAddress = request.remoteAddr

        val probe = rateLimitService.resolveBucket(ipAddress).tryConsumeAndReturnRemaining(1)
        return if (probe.isConsumed) {
            val remainingTokens = probe.remainingTokens.toString()
            response.addHeader(CustomHttpHeader.RATE_LIMIT_REMAINING, remainingTokens)
            log.info("""RateLimit success for "$ipAddress" with $remainingTokens remaining tokens""")
            true
        } else {
            val waitForRefill = TimeUnit.NANOSECONDS.toSeconds(probe.nanosToWaitForRefill).toString()
            response.addHeader(CustomHttpHeader.RATE_LIMIT_RETRY_AFTER_SECONDS, waitForRefill)
            log.info("""RateLimit fail for "$ipAddress". Retry after $waitForRefill seconds""")
            response.sendError(HttpStatus.TOO_MANY_REQUESTS.value())
            false
        }
    }
}
