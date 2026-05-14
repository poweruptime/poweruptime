package org.poweruptime.backend.features.authentication

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.poweruptime.backend.core.exceptions.*
import org.poweruptime.backend.core.resource.CustomHttpHeader
import org.poweruptime.backend.core.utils.orThrowNotFound
import org.poweruptime.backend.features.authentication.config.AuthUtils
import org.poweruptime.backend.features.authentication.service.AccessTokenGenerationService
import org.poweruptime.backend.features.authentication.service.AuthService
import org.poweruptime.backend.features.authentication.service.MFAService
import org.poweruptime.backend.features.authentication.service.OAuthLoginFlowService
import org.poweruptime.backend.features.authentication.service.PasswordResetTokenService
import org.poweruptime.backend.features.authentication.service.SessionService
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
    @param:Qualifier(AuthUtils.AUTHENTICATION_PROVIDER) private val authenticationProvider: DaoAuthenticationProvider,
    @param:Qualifier(AuthUtils.REFRESH_TOKEN_AUTH_PROVIDER) private val refreshTokenAuthProvider:
    JwtAuthenticationProvider,
    private val accessTokenService: AccessTokenGenerationService,
    private val sessionService: SessionService,
    private val authService: AuthService,
    private val passwordResetTokenService: PasswordResetTokenService,
    private val mfaService: MFAService,
    private val oAuthLoginFlowService: OAuthLoginFlowService,
) {
    @Operation(
        summary = "Login",
    )
    @PostMapping("/login")
    fun login(
        @RequestHeader(CustomHttpHeader.MFA_CODE) mfaCode: String?,
        @Valid @RequestBody request: LoginDto,
    ): JwtResponse {
        val auth = authenticationProvider.authenticate(
            UsernamePasswordAuthenticationToken(
                authService.getByEmail(request.email).publicId,
                request.password,
            ),
        )

        val user = authService.getByAuth(auth)

        mfaService.validate(user, mfaCode)

        val sessionToken = sessionService.createSessionIfNeeded(
            stayLoggedIn = request.stayLoggedIn,
            sessionInformation = request.sessionInformation,
            user = user,
        )

        return JwtResponse(
            accessToken = accessTokenService.createToken(auth),
            refreshToken = sessionToken?.token,
        )
    }

    @Operation(
        summary = "Login for oauth2 flow",
    )
    @PostMapping("/login-oauth")
    fun loginOAuth(@Valid @RequestBody request: OAuthLoginDto): JwtResponse {
        val (user, issuer) = oAuthLoginFlowService.getSession(request.code) ?: throw OAuthCodeIncorrectException()

        val sessionToken = sessionService.createSessionForOAuth2(
            sessionInformation = "OAuth session by $issuer",
            user = user,
        )

        val accessToken = accessTokenService.createToken(user.publicId, user.role.grantedAuthorities)

        return JwtResponse(
            accessToken = accessToken,
            refreshToken = sessionToken.token,
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
        val authentication = refreshTokenAuthProvider
            .authenticate(
                BearerTokenAuthenticationToken(request.refreshToken),
            ).orThrowNotFound()

        val sessionToken = sessionService.refreshSession(
            token = request.refreshToken,
            description = request.sessionInformation,
        )

        return JwtResponse(
            accessToken = accessTokenService.createToken(authentication),
            refreshToken = sessionToken.token,
        )
    }

    @Operation(
        summary = "Change password and login",
    )
    @PostMapping("/passwordChange")
    @ResponseStatus(HttpStatus.OK)
    fun passwordChange(
        @RequestHeader(CustomHttpHeader.MFA_CODE) mfaCode: String?,
        @Valid @RequestBody request: LoginWithPasswordChangeDto,
    ): JwtResponse {
        var user = authService.getByEmail(request.email)

        if (request.oldPassword == request.newPassword) throw PasswordChangeIdenticalException()

        // Requires re-authentication through old password
        // AuthDetails implements isCredentialsNonExpired based on the user force password change property.
        // It should throw an CredentialsExpiredException!
        try {
            authenticationProvider.authenticate(
                UsernamePasswordAuthenticationToken(
                    user.publicId,
                    request.oldPassword,
                ),
            )

            throw NoPasswordChangeRequiredException()
        } catch (_: CredentialsExpiredException) {
        }

        mfaService.validate(user, mfaCode)

        user = authService.updateCredentials(user.id, request.newPassword, forcePasswordChange = false)

        val authentication = authenticationProvider.authenticate(
            UsernamePasswordAuthenticationToken(
                user.publicId,
                request.newPassword,
            ),
        )

        val sessionToken = sessionService.createSessionIfNeeded(
            stayLoggedIn = request.stayLoggedIn,
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
        val user = authService.findByEmail(request.email) ?: return

        passwordResetTokenService.create(user)
    }

    @Operation(
        summary = "Update password with token",
    )
    @PostMapping("/resetPassword/update")
    @ResponseStatus(HttpStatus.OK)
    fun updatePasswordWithResetToken(
        @RequestHeader(CustomHttpHeader.MFA_CODE) mfaCode: String?,
        @Valid @RequestBody request: PasswordForgotResetDto,
    ) {
        val user = authService.getByEmail(request.email)

        mfaService.validate(user, mfaCode)

        if (!passwordResetTokenService.validateToken(user.id, request.resetToken)) {
            throw UnauthorizedException()
        }

        authService.updateCredentials(user.id, request.newPassword, forcePasswordChange = false)
    }
}
