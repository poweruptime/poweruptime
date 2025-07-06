package org.poweruptime.backend.features.info

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1")
@Tag(name = "Default Secure API")
class SecureDefaultController(
    private val infoService: InfoService,
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
    fun json(): JsonInfoResponse = infoService.getJsonInfo()
}

@RestController
@RequestMapping("/v1/public")
@Tag(name = "Default API")
class DefaultController(
    private val infoService: InfoService,
) {
    @GetMapping
    fun api() = "Running ${infoService.name}! ( ͡° ͜ʖ ͡°) <br> Version: ${infoService.version}"

    @GetMapping("/json")
    @ResponseBody
    fun json(): JsonInfoResponse = infoService.getJsonInfo(true)
}
