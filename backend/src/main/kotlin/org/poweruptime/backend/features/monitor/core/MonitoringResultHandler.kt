package org.poweruptime.backend.features.monitor.core

import java.time.Duration
import java.time.Instant

class MonitoringResultHandler {
    private val start: Instant = Instant.now()

    private fun getPingMs(): Long = Duration.between(start, Instant.now()).toMillis()

    fun error(title: String, message: String? = null, ping: Long? = null) = CheckResultDto(
        isUp = false,
        pingMs = ping ?: getPingMs(),
        title = title,
        message = message,
    )

    fun success(title: String, message: String? = null, ping: Long? = null) = CheckResultDto(
        isUp = true,
        pingMs = ping ?: getPingMs(),
        title = title,
        message = message,
    )
}

data class CheckResultDto(val pingMs: Long, val isUp: Boolean, val title: String, val message: String? = null)
