package org.poweruptime.backend.features.profile.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.dto.PaginatedResponse
import org.poweruptime.backend.core.dto.toDto
import org.poweruptime.backend.core.exceptions.ForbiddenException
import org.poweruptime.backend.core.exceptions.NotFoundException
import org.poweruptime.backend.features.authentication.SessionResponse
import org.poweruptime.backend.features.authentication.config.AuthUtils
import org.poweruptime.backend.features.authentication.service.AuthService
import org.poweruptime.backend.features.authentication.service.SessionService
import org.poweruptime.backend.features.profile.dto.ProfileResponse
import org.poweruptime.backend.features.profile.dto.UpdateEmailDto
import org.poweruptime.backend.features.profile.dto.UpdatePasswordDto
import org.poweruptime.backend.features.profile.service.EmailChangeTokenService
import org.springdoc.core.annotations.ParameterObject
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.authentication.dao.DaoAuthenticationProvider
import org.springframework.security.core.Authentication
import org.springframework.security.core.AuthenticationException
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/profile")
@Tag(name = "Profile API")
class ProfileController(
    private val authService: AuthService,
    private val sessionService: SessionService,
    private val emailChangeTokenService: EmailChangeTokenService,
    @Qualifier(AuthUtils.AUTHENTICATION_PROVIDER) private val authenticationProvider: DaoAuthenticationProvider
) {

    @Operation(
        summary = "Get profile of authenticated user",
        security = [SecurityRequirement(name = BEARER_AUTH)],
    )
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    fun getProfile(authentication: Authentication): ProfileResponse {
        return ProfileResponse(authService.getByAuthOrThrow(authentication))
    }

    @Operation(
        summary = "Update password of authenticated user",
        security = [SecurityRequirement(name = BEARER_AUTH)],
    )
    @PutMapping("password")
    @ResponseStatus(HttpStatus.OK)
    fun updatePassword(authentication: Authentication, @RequestBody @Valid dto: UpdatePasswordDto) {
        // Check old password, as authentication can not be trusted (already includes authenticated password)
        try {
            authenticationProvider.authenticate(
                UsernamePasswordAuthenticationToken(
                    authentication.name,
                    dto.oldPassword,
                ),
            )
        } catch (_: AuthenticationException) {
            throw ForbiddenException()
        }

        val user = authService.getByAuthOrThrow(authentication)
        authService.updateCredentials(user, dto.newPassword)
    }

    @Operation(
        summary = "Request email update of authenticated user",
        security = [SecurityRequirement(name = BEARER_AUTH)],
    )
    @PutMapping("email")
    @ResponseStatus(HttpStatus.OK)
    fun requestEmailChangeToken(authentication: Authentication, @RequestBody @Valid dto: UpdateEmailDto) {
        // Reauthenticate user
        try {
            authenticationProvider.authenticate(
                UsernamePasswordAuthenticationToken(
                    authentication.name,
                    dto.password,
                ),
            )
        } catch (_: AuthenticationException) {
            throw ForbiddenException()
        }

        emailChangeTokenService.create(authService.getByAuthOrThrow(authentication), dto.email)
    }

    @Operation(
        summary = "Get sessions of authenticated user",
        security = [SecurityRequirement(name = BEARER_AUTH)],
    )
    @GetMapping("sessions")
    @ResponseStatus(HttpStatus.OK)
    fun getSessions(
        authentication: Authentication,
        @ParameterObject @PageableDefault pageable: Pageable,
    ): PaginatedResponse<SessionResponse> = sessionService.getAllPaginated(
        pageable = pageable,
        userId = authentication.name,
    ).toDto { SessionResponse(it) }

    @Operation(
        summary = "Delete a session of authenticated user",
        security = [SecurityRequirement(name = BEARER_AUTH)],
    )
    @DeleteMapping("sessions/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun deleteSession(authentication: Authentication, @PathVariable("id") id: String) {
        if (!sessionService.existsBySessionAndUserId(id, authentication.name)) {
            throw NotFoundException("User session not found")
        }

        sessionService.deleteById(id)
    }
}
