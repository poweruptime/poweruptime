package org.poweruptime.backend.features.info

import org.poweruptime.backend.configuration.JSON_INFO_CACHE_KEY
import org.poweruptime.backend.features.authentication.service.OAuth2ClientRegistrationService
import org.poweruptime.backend.features.instanceSetting.InstanceSettingService
import org.springframework.boot.info.BuildProperties
import org.springframework.cache.annotation.Cacheable
import org.springframework.core.env.Environment
import org.springframework.security.oauth2.client.registration.ClientRegistration
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class InfoService(
    buildProperties: BuildProperties,
    oAuth2ClientRegistrationService: OAuth2ClientRegistrationService,
    private val environment: Environment,
    private val instanceSettingService: InstanceSettingService,
) {
    val name: String = buildProperties.name
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

    val enabledOAuth2Providers = oAuth2ClientRegistrationService.getProviders().map { OAuth2ProviderResponse(it) }
    val oAuth2Enabled = enabledOAuth2Providers.isNotEmpty()
    val serverSetupTime = instanceSettingService.serverSetupTime

    fun getTime(): Instant = Instant.now()

    companion object {
        val startTime: Instant = Instant.now()
    }

    private fun getEnvProperty(name: String): String = environment.getProperty(name)!!

    @Cacheable(value = [JSON_INFO_CACHE_KEY], key = "#secure")
    fun getJsonInfo(secure: Boolean = false) = JsonInfoResponse(
        info = "Running ${if (secure) "SECURE " else ""}$name! ( ͡° ͜ʖ ͡°)",
        version = version,
        serverTime = getTime(),
        serverStartTime = startTime,
        host = host,
        enabledOAuth2Providers = enabledOAuth2Providers,
        serverSetupTime = serverSetupTime,
        supportsSince = instanceSettingService.getSupportsSince(),
        showSupportBadge = instanceSettingService.getShowSupportBadge(),
    )
}

data class JsonInfoResponse(
    val info: String,
    val version: String,
    val serverTime: Instant,
    val serverStartTime: Instant,
    val host: String,
    val enabledOAuth2Providers: List<OAuth2ProviderResponse>,
    val serverSetupTime: Instant,
    val supportsSince: Instant?,
    val showSupportBadge: Boolean,
)

data class OAuth2ProviderResponse(
    val registrationId: String,
    val clientName: String
) {
    constructor(clientRegistration: ClientRegistration) : this(
        clientRegistration.registrationId,
        clientRegistration.clientName,
    )
}
