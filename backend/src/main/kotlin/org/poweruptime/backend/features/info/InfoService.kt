package org.poweruptime.backend.features.info

import org.poweruptime.backend.features.authentication.service.OAuth2ClientRegistrationService
import org.poweruptime.backend.features.info.dto.OAuth2ProviderResponse
import org.springframework.boot.info.BuildProperties
import org.springframework.core.env.Environment
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class InfoService(
    buildProperties: BuildProperties,
    oAuth2ClientRegistrationService: OAuth2ClientRegistrationService,
    private val environment: Environment,
) {
    val name: String = getEnvProperty("spring.application.name")
    val version: String = buildProperties.version
    val buildTime: Instant = buildProperties.time

    val javaRuntimeVersion = getEnvProperty("java.version")

    val osName = getEnvProperty("os.name")
    val osArch = getEnvProperty("os.arch")
    val osVersion = getEnvProperty("os.version")

    val port = getEnvProperty("server.port")

    val swaggerEnabled = getEnvProperty("springdoc.api-docs.enabled")

    val mailEnabled = getEnvProperty("poweruptime.mail.enabled")
    val mailHost = getEnvProperty("spring.mail.host")
    val mailPort = getEnvProperty("spring.mail.port")

    val logLevel = getEnvProperty("logging.level.org.poweruptime")

    val host = getEnvProperty("poweruptime.host")

    val pushEnabled = getEnvProperty("poweruptime.push.enabled")
    val tempNotificationsEnabled = getEnvProperty("poweruptime.notification-temp.enabled")

    val rateLimitEnabled = getEnvProperty("poweruptime.rate-limit.enabled")
    val rateLimitDurationInSeconds = getEnvProperty("poweruptime.rate-limit.duration-in-seconds")
    val rateLimitTries = getEnvProperty("poweruptime.rate-limit.tries")

    val monitorAutoStartEnabled = getEnvProperty("poweruptime.monitor-autostart.enabled")

    val enabledOAuth2Providers = oAuth2ClientRegistrationService.getProviders().map { OAuth2ProviderResponse(it) }
    val oAuth2Enabled = enabledOAuth2Providers.isNotEmpty()

    fun getTime(): Instant = Instant.now()

    val startTime: Instant = Instant.now()

    private fun getEnvProperty(name: String): String = environment.getProperty(name)!!
}
