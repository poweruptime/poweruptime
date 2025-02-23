package org.poweruptime.backend.interceptor

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.poweruptime.backend.core.exceptions.UnauthorizedException
import org.poweruptime.backend.core.resource.CustomHttpHeader
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.servlet.HandlerInterceptor
import java.util.concurrent.TimeUnit

class UserIdBasedRateLimitInterceptor(
    private val userIdBasedRateLimitService: UserIdBasedRateLimitService
) : HandlerInterceptor {
    private val log = LoggerFactory.getLogger(UserIdBasedRateLimitInterceptor::class.java)

    @Throws(Exception::class)
    override fun preHandle(request: HttpServletRequest, response: HttpServletResponse, handler: Any): Boolean {
        val authentication: Authentication? = SecurityContextHolder.getContext().authentication

        val userId = authentication?.name ?: throw UnauthorizedException()

        val probe = userIdBasedRateLimitService.resolveBucket(userId).tryConsumeAndReturnRemaining(1)
        return if (probe.isConsumed) {
            val remainingTokens = probe.remainingTokens.toString()
            response.addHeader(CustomHttpHeader.RATE_LIMIT_REMAINING, remainingTokens)
            log.info("""RateLimit success for "$userId" with $remainingTokens remaining tokens""")
            true
        } else {
            val waitForRefill = TimeUnit.NANOSECONDS.toSeconds(probe.nanosToWaitForRefill).toString()
            response.addHeader(CustomHttpHeader.RATE_LIMIT_RETRY_AFTER_SECONDS, waitForRefill)
            log.info("""RateLimit fail for "$userId". Retry after $waitForRefill seconds""")
            response.sendError(HttpStatus.TOO_MANY_REQUESTS.value())
            false
        }
    }
}
