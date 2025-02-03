package org.poweruptime.backend.features.info

import org.springframework.boot.info.BuildProperties
import org.springframework.core.env.Environment
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class InfoService(
    environment: Environment,
    buildProperties: BuildProperties,
) {
    val name: String = buildProperties.name
    val version: String = buildProperties.version
    val buildTime: Instant = buildProperties.time

    val javaRuntimeVersion = environment.getProperty("java.version")
    val osName = environment.getProperty("os.name")
    val osArch = environment.getProperty("os.arch")
    val osVersion = environment.getProperty("os.version")
    val host = environment.getProperty("poweruptime.host")!!
    val port = environment.getProperty("server.port")
    val swaggerEnabled = environment.getProperty("swagger.enabled")
    val tempNotificationsEnabled = environment.getProperty("poweruptime.notification-temp.enabled")
    val rateLimitEnabled = environment.getProperty("poweruptime.rate-limit.enabled")
    val rateLimitDurationInSeconds = environment.getProperty("poweruptime.rate-limit.duration-in-seconds")
    val rateLimitTries = environment.getProperty("poweruptime.rate-limit.tries")

    fun getTime(): Instant = Instant.now()

    companion object {
        val startTime: Instant = Instant.now()
    }
}
