package org.poweruptime.backend.features.info

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.features.authentication.service.OAuth2ClientRegistrationService
import org.poweruptime.backend.features.instanceSetting.InstanceSettingService
import org.poweruptime.backend.features.user.service.UserService
import org.springframework.security.oauth2.client.registration.ClientRegistration
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.bind.annotation.RestController
import java.time.Instant

@RestController
@RequestMapping("/v1")
@Tag(name = "Default Secure API")
class SecureDefaultController(
    private val infoService: InfoService,
    private val userService: UserService,
    private val instanceSettingService: InstanceSettingService,
    private val oAuth2ClientRegistrationService: OAuth2ClientRegistrationService,
) {
    @Operation(
        summary = "Get info",
        security = [SecurityRequirement(name = BEARER_AUTH)],
    )
    @GetMapping("/secure")
    fun apiSecure() = "Running SECURE ${infoService.name}! ( ͡° ͜ʖ ͡°) <br> Version: ${infoService.version}"

    @Operation(
        summary = "Get json info",
        security = [SecurityRequirement(name = BEARER_AUTH)],
    )
    @GetMapping("/secure/json")
    @ResponseBody
    fun jsonSecure() = getJsonInfo()

    private fun getJsonInfo() = JsonInfoResponse(
        info = "Running SECURE ${infoService.name}! ( ͡° ͜ʖ ͡°)",
        version = infoService.version,
        serverTime = infoService.getTime(),
        serverStartTime = InfoService.startTime,
        host = infoService.host,
        setup = userService.isSetup(),
        serverSetupTime = instanceSettingService.serverSetupTime,
        supportsSince = instanceSettingService.getSupportsSince(),
        showSupportBadge = instanceSettingService.getShowSupportBadge(),
        enabledOAuth2Providers = oAuth2ClientRegistrationService.getProviders().map { OAuth2ProviderResponse(it) },
    )
}

@RestController
@RequestMapping("/v1/public")
@Tag(name = "Default API")
class DefaultController(
    private val infoService: InfoService,
    private val userService: UserService,
    private val instanceSettingService: InstanceSettingService,
    private val oAuth2ClientRegistrationService: OAuth2ClientRegistrationService,
) {
    @GetMapping
    fun api() = "Running ${infoService.name}! ( ͡° ͜ʖ ͡°) <br> Version: ${infoService.version}"

    @GetMapping("/json")
    @ResponseBody
    fun json() = getJsonInfo()

    private fun getJsonInfo() = JsonInfoResponse(
        info = "Running ${infoService.name}! ( ͡° ͜ʖ ͡°)",
        version = infoService.version,
        serverTime = infoService.getTime(),
        serverStartTime = InfoService.startTime,
        host = infoService.host,
        setup = userService.isSetup(),
        serverSetupTime = instanceSettingService.serverSetupTime,
        supportsSince = instanceSettingService.getSupportsSince(),
        showSupportBadge = instanceSettingService.getShowSupportBadge(),
        enabledOAuth2Providers = oAuth2ClientRegistrationService.getProviders().map { OAuth2ProviderResponse(it) },
    )
}

data class JsonInfoResponse(
    val info: String,
    val version: String,
    val serverTime: Instant,
    val serverStartTime: Instant,
    val serverSetupTime: Instant,
    val supportsSince: Instant?,
    val showSupportBadge: Boolean,
    val host: String,
    val setup: Boolean,
    val enabledOAuth2Providers: List<OAuth2ProviderResponse>
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
