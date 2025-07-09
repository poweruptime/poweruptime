package org.poweruptime.backend.features.info

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.dto.BooleanResponse
import org.poweruptime.backend.features.user.service.UserService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/secure")
@Tag(name = "Default Secure API")
class SecureDefaultController(
    private val infoService: InfoService,
    private val userService: UserService,
) {
    @Operation(
        summary = "Get info",
        security = [SecurityRequirement(name = BEARER_AUTH)],
    )
    @GetMapping()
    fun apiSecure() = "Running SECURE ${infoService.name}! ( ͡° ͜ʖ ͡°) <br> Version: ${infoService.version}"

    @Operation(
        summary = "Get json info",
        security = [SecurityRequirement(name = BEARER_AUTH)],
    )
    @GetMapping("/json")
    @ResponseBody
    fun json(): JsonInfoResponse = infoService.getJsonInfo()

    @Operation(
        summary = "Get setup info",
        security = [SecurityRequirement(name = BEARER_AUTH)],
    )
    @GetMapping("/is-setup")
    @ResponseBody
    fun isSetup(): BooleanResponse = BooleanResponse(userService.isSetup())
}

@RestController
@RequestMapping("/v1/public")
@Tag(name = "Default API")
class DefaultController(
    private val infoService: InfoService,
    private val userService: UserService,
) {
    @Operation(summary = "Get info")
    @GetMapping
    fun api() = "Running ${infoService.name}! ( ͡° ͜ʖ ͡°) <br> Version: ${infoService.version}"

    @Operation(summary = "Get json info")
    @GetMapping("/json")
    @ResponseBody
    fun json(): JsonInfoResponse = infoService.getJsonInfo(true)

    @Operation(summary = "Get setup info")
    @GetMapping("/is-setup")
    @ResponseBody
    fun isSetup(): BooleanResponse = BooleanResponse(userService.isSetup())
}
