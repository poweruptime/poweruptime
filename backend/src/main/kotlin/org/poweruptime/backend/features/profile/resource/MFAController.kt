package org.poweruptime.backend.features.profile.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.resource.CustomHttpHeader
import org.poweruptime.backend.core.utils.toBase32EncodedString
import org.poweruptime.backend.features.authentication.service.AuthService
import org.poweruptime.backend.features.authentication.service.MFAService
import org.poweruptime.backend.features.profile.dto.ConfirmMFADto
import org.poweruptime.backend.features.profile.dto.ConfirmMFAResponse
import org.poweruptime.backend.features.profile.dto.MFAState
import org.poweruptime.backend.features.profile.dto.SetupMFAResponse
import org.springframework.http.HttpStatus
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/profile/mfa")
@Tag(name = "MFA API")
class MFAController(
    private val authService: AuthService,
    private val mfaService: MFAService,
) {
    @Operation(
        summary = "Get MFA state",
        security = [SecurityRequirement(name = BEARER_AUTH)],
    )
    @GetMapping("state")
    @ResponseStatus(HttpStatus.OK)
    fun getState(authentication: Authentication): MFAState {
        val mfa = mfaService.getByUserId(authentication.name)

        return if (mfa != null) {
            if (mfa.active) MFAState.ENABLED else MFAState.DISABLED
        } else {
            MFAState.DISABLED
        }
    }

    @Operation(
        summary = "Setup MFA",
        security = [SecurityRequirement(name = BEARER_AUTH)],
    )
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    fun setup(authentication: Authentication): SetupMFAResponse {
        val user = authService.getByAuthOrThrow(authentication)

        val mfa = mfaService.create(user)

        return SetupMFAResponse(base32Secret = mfa.secret.toBase32EncodedString())
    }

    @Operation(
        summary = "Confirm MFA",
        security = [SecurityRequirement(name = BEARER_AUTH)],
    )
    @PostMapping
    @ResponseStatus(HttpStatus.OK)
    fun confirm(authentication: Authentication, @Valid @RequestBody dto: ConfirmMFADto): ConfirmMFAResponse =
        ConfirmMFAResponse(
            backupCodes = mfaService.activate(
                userId = authService.getByAuthOrThrow(authentication).id,
                code = dto.code,
            ),
        )

    @Operation(
        summary = "Delete MFA",
        security = [SecurityRequirement(name = BEARER_AUTH)],
    )
    @DeleteMapping
    @ResponseStatus(HttpStatus.OK)
    fun delete(
        authentication: Authentication,
        @RequestHeader(CustomHttpHeader.MFA_CODE) mfaCode: String?,
    ) {
        val user = authService.getByAuthOrThrow(authentication)

        mfaService.validate(user.id, mfaCode)

        mfaService.delete(user)
    }
}
