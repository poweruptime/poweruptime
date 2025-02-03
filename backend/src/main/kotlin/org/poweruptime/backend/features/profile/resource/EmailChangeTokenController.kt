package org.poweruptime.backend.features.profile.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.poweruptime.backend.features.profile.service.EmailChangeTokenService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/public/email-change")
@Tag(name = "Email change token API")
class EmailChangeTokenController(
    private val emailChangeTokenService: EmailChangeTokenService,
) {
    @Operation(
        summary = "Confirm email change token",
    )
    @GetMapping("confirm/{token}")
    @ResponseStatus(HttpStatus.OK)
    fun confirm(@PathVariable("token") token: String): Unit = emailChangeTokenService.validateToken(token)

    @Operation(
        summary = "Undo email change token and clear all sessions",
    )
    @GetMapping("undo/{token}")
    @ResponseStatus(HttpStatus.OK)
    fun undo(@PathVariable("token") token: String): Unit = emailChangeTokenService.undo(token)
}
