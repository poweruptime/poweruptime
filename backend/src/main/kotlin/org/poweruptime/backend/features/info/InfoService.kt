package org.poweruptime.backend.features.info

import org.poweruptime.backend.configuration.JSON_INFO_CACHE_KEY
import org.poweruptime.backend.features.authentication.service.OAuth2ClientRegistrationService
import org.poweruptime.backend.features.instanceSetting.InstanceSettingService
import org.poweruptime.backend.features.user.service.UserService
import org.springframework.boot.info.BuildProperties
import org.springframework.cache.annotation.Cacheable
import org.springframework.core.env.Environment
import org.springframework.security.oauth2.client.registration.ClientRegistration
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class InfoService(
    environment: Environment,
    buildProperties: BuildProperties,
    private val userService: UserService,
    private val instanceSettingService: InstanceSettingService,
    oAuth2ClientRegistrationService: OAuth2ClientRegistrationService,
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

    val enabledOAuth2Providers = oAuth2ClientRegistrationService.getProviders().map { OAuth2ProviderResponse(it) }
    val oAuth2Enabled = enabledOAuth2Providers.isNotEmpty()
    val serverSetupTime = instanceSettingService.serverSetupTime

    fun getTime(): Instant = Instant.now()

    companion object {
        val startTime: Instant = Instant.now()
    }

    @Cacheable(value = [JSON_INFO_CACHE_KEY], key = "#secure")
    fun getJsonInfo(secure: Boolean = false) = JsonInfoResponse(
        info = "Running ${if (secure) "SECURE " else ""}$name! ( ͡° ͜ʖ ͡°)",
        version = version,
        serverTime = getTime(),
        serverStartTime = startTime,
        host = host,
        enabledOAuth2Providers = enabledOAuth2Providers,
        serverSetupTime = serverSetupTime,
        setup = userService.isSetup(),
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
    val setup: Boolean,
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
