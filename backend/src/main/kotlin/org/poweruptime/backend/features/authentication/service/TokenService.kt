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

@Service
class AccessTokenGenerationService(
    @Qualifier(AuthUtils.JWT_ACCESS_TOKEN_ENCODER) accessTokenEncoder: JwtEncoder
) : TokenGenerationService(accessTokenEncoder, 60.minutes)

@Service
class RefreshTokenGenerationService(
    @Qualifier(AuthUtils.JWT_REFRESH_TOKEN_ENCODER) refreshTokenEncoder: JwtEncoder
) : TokenGenerationService(refreshTokenEncoder, 30.days)

abstract class TokenGenerationService(
    private val jwtEncoder: JwtEncoder,
    val validDuration: Duration
) {
    fun createToken(authentication: Authentication) =
        createToken(authentication.publicUserId(), authentication.authorities)

    fun createToken(publicUserId: String, authorities: Collection<GrantedAuthority>): String {
        val now = Instant.now()
        val expirationTime = now.plusSeconds(validDuration.inWholeSeconds)

        val claims = JwtClaimsSet.builder()
            .issuer("poweruptime")
            .issuedAt(now)
            .expiresAt(expirationTime)
            .subject(publicUserId)
            .claim("scope", createScope(authorities))
            .build()

        return jwtEncoder.encode(
            JwtEncoderParameters.from(claims),
        ).tokenValue
    }

    private fun createScope(authorities: Collection<GrantedAuthority>): String {
        return authorities.stream()
            .map { obj: GrantedAuthority -> obj.authority }
            .collect(Collectors.joining(" "))
    }
}
