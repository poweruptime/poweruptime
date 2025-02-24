package org.poweruptime.backend.core.resource

object CustomHttpHeader {
    const val RATE_LIMIT_REMAINING = "X-Rate-Limit-Remaining"
    const val RATE_LIMIT_RETRY_AFTER_SECONDS = "X-Rate-Limit-Retry-After-Seconds"
    const val MFA_CODE = "X-MFA-Code"
}
