package org.poweruptime.backend.features.info

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.REQUIRED_AUTH
import org.poweruptime.backend.core.SYSTEM_ROLE_ADMIN
import org.poweruptime.backend.core.dto.BooleanResponse
import org.poweruptime.backend.features.info.dto.InfoAdminResponse
import org.poweruptime.backend.features.info.dto.InfoSupportResponse
import org.poweruptime.backend.features.info.dto.InfoTimeResponse
import org.poweruptime.backend.features.info.dto.OAuth2ProviderResponse
import org.poweruptime.backend.features.info.dto.SettingStringDto
import org.poweruptime.backend.features.info.instanceSetting.InstanceSettingService
import org.poweruptime.backend.features.user.service.UserService
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/public/info")
@Tag(name = "Public Info API")
class PublicInfoController(
    private val infoService: InfoService,
    private val instanceSettingService: InstanceSettingService,
    private val userService: UserService,
) {
    @Operation(summary = "Get host")
    @GetMapping("/host")
    fun getHost(): SettingStringDto = SettingStringDto(
        infoService.host,
    )

    @Operation(summary = "Get version")
    @GetMapping("/version")
    fun getVersion(): SettingStringDto = SettingStringDto(
        infoService.version,
    )

    @Operation(summary = "Get enabled OAuth2 Providers")
    @GetMapping("/oauth2")
    fun getOAuth2Providers(): List<OAuth2ProviderResponse> = infoService.enabledOAuth2Providers

    @Operation(summary = "Get setup")
    @GetMapping("/is-setup")
    @ResponseBody
    fun isSetup(): BooleanResponse = BooleanResponse(userService.isSetup())

    @Operation(summary = "Get support status")
    @GetMapping("/support")
    fun getSupport(): InfoSupportResponse = InfoSupportResponse(
        supportsSince = instanceSettingService.getSupportsSince(),
        showSupportBadge = instanceSettingService.getShowSupportBadge(),
    )
}

@RestController
@RequestMapping("/v1/info")
@Tag(name = "Info API")
class InfoController(
    private val infoService: InfoService,
    private val instanceSettingService: InstanceSettingService,
) {
    @Operation(
        summary = "Get server time",
        security = [SecurityRequirement(name = BEARER_AUTH)],
    )
    @GetMapping("/time")
    fun getTime(): InfoTimeResponse = InfoTimeResponse(
        serverTime = infoService.getTime(),
        serverStartTime = infoService.startTime,
        serverSetupTime = instanceSettingService.serverSetupTime,
    )

    @Operation(summary = "Get isUserAllowedToCreateTeams")
    @GetMapping("/isUserAllowedToCreateTeams")
    fun getIsUserAllowedToCreateTeams(): BooleanResponse = BooleanResponse(
        instanceSettingService.getUserAllowedToCreateTeams(),
    )

    @Operation(summary = "Get showNewVersionDialog")
    @GetMapping("/showNewVersionDialog")
    fun getShowNewVersionDialog(): BooleanResponse = BooleanResponse(
        instanceSettingService.getShowNewVersionDialog(),
    )

    @Operation(
        summary = "Get admin environment info",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/environment")
    fun adminInfo(): InfoAdminResponse = InfoAdminResponse(
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
    )
}
