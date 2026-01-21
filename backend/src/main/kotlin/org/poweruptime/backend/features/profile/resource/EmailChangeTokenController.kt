package org.poweruptime.backend.features.profile.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.exceptions.ForbiddenException
import org.poweruptime.backend.core.exceptions.ServiceUnavailableException
import org.poweruptime.backend.core.resource.CustomHttpHeader
import org.poweruptime.backend.features.authentication.config.AuthUtils
import org.poweruptime.backend.features.authentication.service.MFAService
import org.poweruptime.backend.features.authentication.service.publicUserId
import org.poweruptime.backend.features.authentication.service.user
import org.poweruptime.backend.features.info.InfoService
import org.poweruptime.backend.features.profile.dto.UpdateEmailDto
import org.poweruptime.backend.features.profile.service.EmailChangeTokenService
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.http.HttpStatus
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.authentication.dao.DaoAuthenticationProvider
import org.springframework.security.core.Authentication
import org.springframework.security.core.AuthenticationException
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1")
@Tag(name = "Email change token API")
class EmailChangeTokenController(
    private val mfaService: MFAService,
    private val emailChangeTokenService: EmailChangeTokenService,
    private val infoService: InfoService,
    @param:Qualifier(AuthUtils.AUTHENTICATION_PROVIDER) private val authenticationProvider: DaoAuthenticationProvider,
) {
    @Operation(
        summary = "Request email update of authenticated user",
        security = [SecurityRequirement(name = BEARER_AUTH)],
    )
    @PutMapping("/profile/email")
    @ResponseStatus(HttpStatus.OK)
    fun requestEmailChangeToken(
        @RequestHeader(CustomHttpHeader.MFA_CODE) mfaCode: String?,
        auth: Authentication,
        @RequestBody @Valid dto: UpdateEmailDto,
    ) {
        if (infoService.oAuth2Enabled) {
            throw ServiceUnavailableException("E-mail change disabled because of OAuth2 being enabled")
        }

        // Reauthenticate user
        try {
            authenticationProvider.authenticate(
                UsernamePasswordAuthenticationToken(
                    auth.publicUserId(),
                    dto.password,
                ),
            )
        } catch (_: AuthenticationException) {
            throw ForbiddenException()
        }

        val user = auth.user()

        mfaService.validate(user, mfaCode)

        emailChangeTokenService.create(user, dto.email)
    }

    @Operation(
        summary = "Confirm email change token",
    )
    @GetMapping("/public/email-change/confirm/{token}")
    @ResponseStatus(HttpStatus.OK)
    fun confirm(@PathVariable("token") token: String): Unit = emailChangeTokenService.validateToken(token)

    @Operation(
        summary = "Undo email change token and clear all sessions",
    )
    @GetMapping("/public/email-change/undo/{token}")
    @ResponseStatus(HttpStatus.OK)
    fun undo(@PathVariable("token") token: String): Unit = emailChangeTokenService.undo(token)
}
