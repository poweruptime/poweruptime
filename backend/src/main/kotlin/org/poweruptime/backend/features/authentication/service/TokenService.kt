package org.poweruptime.backend.features.authentication.service

import org.poweruptime.backend.features.authentication.config.AuthUtils
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.security.core.Authentication
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.oauth2.jwt.JwtClaimsSet
import org.springframework.security.oauth2.jwt.JwtEncoder
import org.springframework.security.oauth2.jwt.JwtEncoderParameters
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.stream.Collectors
import kotlin.time.Duration
import kotlin.time.Duration.Companion.days
import kotlin.time.Duration.Companion.minutes

/**
 * UserAccessTokenService creates a TokenService for creating JWT access tokens
 * @see TokenGenerationService
 * @since 2.0.0
 */
@Service
class AccessTokenGenerationService(
    @Qualifier(AuthUtils.JWT_ACCESS_TOKEN_ENCODER) accessTokenEncoder: JwtEncoder
) : TokenGenerationService(accessTokenEncoder, 60.minutes)

/**
 * UserRefreshTokenService creates a TokenService for creating JWT refresh tokens
 * @see TokenGenerationService
 * @since 2.0.0
 */
@Service
class RefreshTokenGenerationService(
    @Qualifier(AuthUtils.JWT_REFRESH_TOKEN_ENCODER) refreshTokenEncoder: JwtEncoder
) : TokenGenerationService(refreshTokenEncoder, 30.days)

/**
 * TokenService is responsible for creating JWT tokens based on the authentication
 * This class must be subclassed to be used
 *
 * @author Alexander Kauer
 * @since 2.0.0
 */
abstract class TokenGenerationService(
    private val jwtEncoder: JwtEncoder,
    private val validDuration: Duration
) {
    fun createToken(authentication: Authentication): String {
        val now = Instant.now()
        val expirationTime = now.plusSeconds(validDuration.inWholeSeconds)

        val claims = JwtClaimsSet.builder()
            .issuer("self")
            .issuedAt(now)
            .expiresAt(expirationTime)
            .subject(authentication.name)
            .claim("scope", createScope(authentication))
            .build()

        return jwtEncoder.encode(
            JwtEncoderParameters.from(claims),
        ).tokenValue
    }

    private fun createScope(authentication: Authentication): String {
        return authentication.authorities.stream()
            .map { obj: GrantedAuthority -> obj.authority }
            .collect(Collectors.joining(" "))
    }
}
