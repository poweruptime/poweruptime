package org.poweruptime.backend.features.authentication.service

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.features.HostService
import org.poweruptime.backend.features.authentication.model.SystemRole
import org.poweruptime.backend.features.user.CreateUserDto
import org.poweruptime.backend.features.user.service.UserService
import org.springframework.security.core.Authentication
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.security.web.authentication.AuthenticationSuccessHandler
import org.springframework.stereotype.Component
import org.springframework.web.util.UriComponentsBuilder
import java.net.URLEncoder

@Component
class OAuth2LoginSuccessHandler(
    private val hostService: HostService,
    private val authService: AuthService,
    private val userService: UserService,
    private val oAuthLoginFlowService: OAuthLoginFlowService
) : AuthenticationSuccessHandler {
    override fun onAuthenticationSuccess(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authentication: Authentication,
    ) {
        // the principal is the DefaultOAuth2User we returned above
        val oauthUser = authentication.principal as OAuth2User

        val email: String = oauthUser.attributes["email"] as String? ?: throw BadRequestException("Email required")

        val user = authService.findByEmail(email) ?: userService.create(
            dto = CreateUserDto(
                name = email,
                email = email,
                role = SystemRole.USER,
                activated = true,
                sendInvitation = false,
                password = null,
            ),
            forcePasswordChange = false,
        )

        if (!user.activated) {
            val redirectUri = UriComponentsBuilder
                .fromUriString("${hostService.urlHost}/auth/oauth2/callback")
                .queryParam("error", URLEncoder.encode("not_activated", "UTF-8"))
                .build()
                .toUriString()

            response.sendRedirect(redirectUri)
        }

        val code = oAuthLoginFlowService.addSession(
            OAuthLoginSession(
                user = user,
                issuer = oauthUser.attributes["iss"] as? String ?: "unknown issuer"
            )
        )

        // Build the redirect URL with login code as query params
        val redirectUri = UriComponentsBuilder
            .fromUriString("${hostService.urlHost}/auth/oauth2/callback")
            .queryParam("code", URLEncoder.encode(code, "UTF-8"))
            .build()
            .toUriString()

        response.sendRedirect(redirectUri)
    }
}
