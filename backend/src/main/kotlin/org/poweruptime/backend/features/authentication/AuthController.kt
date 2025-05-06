package org.poweruptime.backend.features.authentication

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.poweruptime.backend.core.dto.IdResponse
import org.poweruptime.backend.core.exceptions.*
import org.poweruptime.backend.core.resource.CustomHttpHeader
import org.poweruptime.backend.features.authentication.config.AuthUtils
import org.poweruptime.backend.features.authentication.model.SystemRole
import org.poweruptime.backend.features.authentication.service.AccessTokenGenerationService
import org.poweruptime.backend.features.authentication.service.AuthService
import org.poweruptime.backend.features.authentication.service.MFAService
import org.poweruptime.backend.features.authentication.service.PasswordResetTokenService
import org.poweruptime.backend.features.authentication.service.SessionService
import org.poweruptime.backend.features.user.dto.CreateUserDto
import org.poweruptime.backend.features.user.service.UserService
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.http.HttpStatus
import org.springframework.security.authentication.CredentialsExpiredException
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.authentication.dao.DaoAuthenticationProvider
import org.springframework.security.oauth2.server.resource.authentication.BearerTokenAuthenticationToken
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationProvider
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/auth")
@Tag(name = "Authentication API")
class AuthController(
    @Qualifier(AuthUtils.AUTHENTICATION_PROVIDER) private val authenticationProvider: DaoAuthenticationProvider,
    @Qualifier(AuthUtils.REFRESH_TOKEN_AUTH_PROVIDER) private val refreshTokenAuthProvider: JwtAuthenticationProvider,
    private val accessTokenService: AccessTokenGenerationService,
    private val sessionService: SessionService,
    private val authService: AuthService,
    private val passwordResetTokenService: PasswordResetTokenService,
    private val mfaService: MFAService,
    private val userService: UserService,
) {

    @Operation(
        summary = "Login",
    )
    @PostMapping("/login")
    fun login(
        @RequestHeader(CustomHttpHeader.MFA_CODE) mfaCode: String?,
        @Valid @RequestBody request: LoginDto
    ): JwtResponse {
        val authentication = authenticationProvider.authenticate(
            UsernamePasswordAuthenticationToken(
                authService.getByEmailOrThrow(request.email).id,
                request.password,
            ),
        )

        val user = authService.getByAuthOrThrow(authentication)

        if (!user.activated) {
            throw AccountNotActivatedException()
        }

        mfaService.validate(user.id, mfaCode)

        val sessionToken = sessionService.createSessionIfNeeded(
            stayLoggedIn = request.stayLoggedIn,
            authentication = authentication,
            sessionInformation = request.sessionInformation,
            user = user,
        )

        return JwtResponse(
            accessToken = accessTokenService.createToken(authentication),
            refreshToken = sessionToken?.token,
        )
    }

    @Operation(
        summary = "Logout",
    )
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.OK)
    fun logout(@RequestBody @Valid request: LogoutDto) {
        refreshTokenAuthProvider.authenticate(
            BearerTokenAuthenticationToken(request.refreshToken),
        )

        sessionService.invalidateSessionByRefreshToken(request.refreshToken)
    }

    @Operation(
        summary = "Refresh access token",
    )
    @PostMapping("/refresh")
    @ResponseStatus(HttpStatus.OK)
    fun refresh(@Valid @RequestBody request: RefreshJwtWithSessionTokenDto): JwtResponse {
        val authentication = refreshTokenAuthProvider.authenticate(
            BearerTokenAuthenticationToken(request.refreshToken),
        )

        val sessionToken = sessionService.refreshSession(
            authentication = authentication,
            token = request.refreshToken,
            description = request.sessionInformation,
        )

        return JwtResponse(
            accessToken = accessTokenService.createToken(authentication),
            refreshToken = sessionToken.token,
        )
    }

    @Operation(
        summary = "Setup first user",
    )
    @PostMapping("/setup")
    @ResponseStatus(HttpStatus.OK)
    fun setup(@Valid @RequestBody request: SetupDto): IdResponse {
        if (!userService.isSetup()) {
            throw BadRequestException()
        }

        return IdResponse(
            userService.create(
                dto = CreateUserDto(
                    name = request.name,
                    email = request.email,
                    role = SystemRole.ADMIN,
                    sendInvitation = true,
                    password = null,
                    activated = true,
                ),
            ),
        )
    }

    @Operation(
        summary = "Change password and login",
    )
    @PostMapping("/passwordChange")
    @ResponseStatus(HttpStatus.OK)
    fun passwordChange(
        @RequestHeader(CustomHttpHeader.MFA_CODE) mfaCode: String?,
        @Valid @RequestBody request: LoginWithPasswordChangeDto
    ): JwtResponse {
        var user = authService.getByEmailOrThrow(request.email)

        if (request.oldPassword == request.newPassword) throw PasswordChangeIdenticalException()

        // Requires re-authentication through old password
        // AuthDetails implements isCredentialsNonExpired based on the user force password change property.
        // It should throw an CredentialsExpiredException!
        try {
            authenticationProvider.authenticate(
                UsernamePasswordAuthenticationToken(
                    user.id,
                    request.oldPassword,
                ),
            )

            throw NoPasswordChangeRequiredException()
        } catch (_: CredentialsExpiredException) {}

        mfaService.validate(user.id, mfaCode)

        user.forcePasswordChange = false
        user = authService.updateCredentials(user, request.newPassword)

        val authentication = authenticationProvider.authenticate(
            UsernamePasswordAuthenticationToken(
                user.id,
                request.newPassword,
            ),
        )

        val sessionToken = sessionService.createSessionIfNeeded(
            stayLoggedIn = request.stayLoggedIn,
            authentication = authentication,
            sessionInformation = request.sessionInformation,
            user = user,
        )

        return JwtResponse(
            accessToken = accessTokenService.createToken(authentication),
            refreshToken = sessionToken?.token,
        )
    }

    @Operation(
        summary = "Request a password reset",
    )
    @PostMapping("/resetPassword")
    @ResponseStatus(HttpStatus.OK)
    fun requestPasswordReset(@Valid @RequestBody request: PasswordForgotRequestDto) {
        val user = authService.getByEmail(request.email) ?: return

        passwordResetTokenService.create(user)
    }

    @Operation(
        summary = "Update password with token",
    )
    @PostMapping("/resetPassword/update")
    @ResponseStatus(HttpStatus.OK)
    fun updatePasswordWithResetToken(
        @RequestHeader(CustomHttpHeader.MFA_CODE) mfaCode: String?,
        @Valid @RequestBody request: PasswordForgotResetDto
    ) {
        val user = authService.getByEmailOrThrow(request.email)

        mfaService.validate(user.id, mfaCode)

        passwordResetTokenService.validateToken(user.id, request.resetToken) ?: throw UnauthorizedException()

        authService.updateCredentials(user, request.newPassword)
    }
}
