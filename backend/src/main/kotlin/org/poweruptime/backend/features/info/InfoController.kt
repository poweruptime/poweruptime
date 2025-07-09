package org.poweruptime.backend.features.info

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.REQUIRED_AUTH
import org.poweruptime.backend.core.SYSTEM_ROLE_ADMIN
import org.poweruptime.backend.features.authentication.service.OAuth2ClientRegistrationService
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.oauth2.client.registration.ClientRegistration
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/info")
@Tag(name = "Info API")
class InfoController(
    private val infoService: InfoService,
    private val oAuth2ClientRegistrationService: OAuth2ClientRegistrationService,
) {
    @Operation(
        summary = "Get admin environment info",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/environment")
    fun adminInfo(): AdminInfoResponse = AdminInfoResponse(
        javaRuntimeVersion = infoService.javaRuntimeVersion,
        osName = infoService.osName,
        osArch = infoService.osArch,
        osVersion = infoService.osVersion,
        host = infoService.host,
        port = infoService.port,
        swaggerEnabled = infoService.swaggerEnabled,
        mailEnabled = infoService.mailEnabled,
        mailHost = infoService.mailHost,
        mailPort = infoService.mailPort,
        logLevel = infoService.logLevel,
        pushEnabled = infoService.pushEnabled,
        tempNotificationsEnabled = infoService.tempNotificationsEnabled,
        rateLimitEnabled = infoService.rateLimitEnabled,
        rateLimitDurationInSeconds = infoService.rateLimitDurationInSeconds,
        rateLimitTries = infoService.rateLimitTries,
        oauth2Providers = oAuth2ClientRegistrationService.getProviders().map { OAuth2ProviderInfoResponse(it) },
    )
}

data class AdminInfoResponse(
    val javaRuntimeVersion: String,
    val osName: String,
    val osArch: String,
    val osVersion: String,
    val host: String,
    val port: String,
    val swaggerEnabled: String,
    val mailEnabled: String,
    val mailHost: String,
    val mailPort: String,
    val logLevel: String,
    val pushEnabled: String,
    val tempNotificationsEnabled: String,
    val rateLimitEnabled: String,
    val rateLimitDurationInSeconds: String,
    val rateLimitTries: String,
    val oauth2Providers: List<OAuth2ProviderInfoResponse>
)

data class OAuth2ProviderInfoResponse(
    val registrationId: String,
    val clientName: String,
    val clientId: String
) {
    constructor(clientRegistration: ClientRegistration) : this(
        clientRegistration.registrationId,
        clientRegistration.clientName,
        clientRegistration.clientId,
    )
}
