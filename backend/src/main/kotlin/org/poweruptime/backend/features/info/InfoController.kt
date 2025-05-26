package org.poweruptime.backend.features.info

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.REQUIRED_AUTH
import org.poweruptime.backend.core.SYSTEM_ROLE_ADMIN
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/info")
@Tag(name = "Info API")
class InfoController(
    private val infoService: InfoService,
) {
    @Operation(
        summary = "Get admin environment info",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/environment")
    fun adminInfo(): AdminInfoResponse = AdminInfoResponse(
        mapOf(
            "javaRuntimeVersion" to infoService.javaRuntimeVersion,
            "osName" to infoService.osName,
            "osArch" to infoService.osArch,
            "osVersion" to infoService.osVersion,
            "host" to infoService.host,
            "port" to infoService.port,
            "swaggerEnabled" to infoService.swaggerEnabled,
            "tempNotificationsEnabled" to infoService.tempNotificationsEnabled,
            "rateLimitEnabled" to infoService.rateLimitEnabled,
            "rateLimitDurationInSeconds" to infoService.rateLimitDurationInSeconds,
            "rateLimitTries" to infoService.rateLimitTries,
        ),
    )
}

data class AdminInfoResponse(
    val infos: Map<String, String?>
)
