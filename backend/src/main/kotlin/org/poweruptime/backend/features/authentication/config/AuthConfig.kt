package org.poweruptime.backend.features.authentication.config

import com.nimbusds.jose.jwk.JWKSet
import com.nimbusds.jose.jwk.RSAKey
import com.nimbusds.jose.jwk.source.ImmutableJWKSet
import org.poweruptime.backend.features.authentication.service.AuthDetailsService
import org.poweruptime.backend.features.authentication.service.AuthService
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary
import org.springframework.core.convert.converter.Converter
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.authentication.dao.DaoAuthenticationProvider
import org.springframework.security.crypto.factory.PasswordEncoderFactories
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.oauth2.jwt.*
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationProvider
import org.springframework.stereotype.Component

object AuthUtils {
    const val AUTH_DETAILS_SERVICE = "AUTH_DETAILS_SERVICE"
    const val ACCESS_TOKEN_AUTH_PROVIDER = "ACCESS_TOKEN_AUTH_PROVIDER"
    const val REFRESH_TOKEN_AUTH_PROVIDER = "REFRESH_TOKEN_AUTH_PROVIDER"
    const val AUTHENTICATION_PROVIDER = "AUTHENTICATION_PROVIDER"
    const val JWT_ACCESS_TOKEN_DECODER = "JWT_ACCESS_TOKEN_DECODER"
    const val JWT_ACCESS_TOKEN_ENCODER = "JWT_ACCESS_TOKEN_ENCODER"
    const val JWT_REFRESH_TOKEN_DECODER = "JWT_REFRESH_TOKEN_DECODER"
    const val JWT_REFRESH_TOKEN_ENCODER = "JWT_REFRESH_TOKEN_ENCODER"
}

@Configuration
class AuthConfig(val keyUtils: KeyUtils) {
    @Bean
    fun passwordEncoder(): PasswordEncoder =
        PasswordEncoderFactories.createDelegatingPasswordEncoder()

    /**
     * Service to get an authenticated user from the database
     */
    @Bean(AuthUtils.AUTH_DETAILS_SERVICE)
    fun userAuthDetailsService(authService: AuthService): AuthDetailsService {
        return AuthDetailsService(authService)
    }

    /**
     * Unused!
     * JwtAuthenticationProvider for user access tokens
     * This is needed for every request to convert a JWT to a user
     */
    @Bean(AuthUtils.ACCESS_TOKEN_AUTH_PROVIDER)
    fun accessTokenAuthProvider(
        @Qualifier(AuthUtils.JWT_ACCESS_TOKEN_DECODER) accessTokenDecoder: JwtDecoder,
        jwtToUserConverter: JwtToUserConverter
    ): JwtAuthenticationProvider {
        val provider = JwtAuthenticationProvider(accessTokenDecoder)
        provider.setJwtAuthenticationConverter(jwtToUserConverter)
        return provider
    }

    /**
     * JwtAuthenticationProvider for user access tokens
     * This is needed for refresh tokens to convert a JWT to a user while refreshing
     */
    @Bean(AuthUtils.REFRESH_TOKEN_AUTH_PROVIDER)
    fun refreshTokenAuthProvider(
        @Qualifier(AuthUtils.JWT_REFRESH_TOKEN_DECODER) jwtRefreshTokenDecoder: JwtDecoder,
        jwtToUserConverter: JwtToUserConverter
    ): JwtAuthenticationProvider {
        val provider = JwtAuthenticationProvider(jwtRefreshTokenDecoder)
        provider.setJwtAuthenticationConverter(jwtToUserConverter)
        return provider
    }

    /**
     * Creates an ProviderManager
     * This can be consumed by authentication controllers to authenticate user with their credentials
     */
    @Bean(AuthUtils.AUTHENTICATION_PROVIDER)
    @Qualifier(AuthUtils.AUTHENTICATION_PROVIDER)
    fun authenticationProvider(
        authDetailsService: AuthDetailsService,
        passwordEncoder: PasswordEncoder
    ): DaoAuthenticationProvider {
        val authProvider = DaoAuthenticationProvider()
        authProvider.setUserDetailsService(authDetailsService)
        authProvider.setPasswordEncoder(passwordEncoder)
        return authProvider
    }

    /**
     * JwtDecoder for user access tokens
     */
    @Bean(AuthUtils.JWT_ACCESS_TOKEN_DECODER)
    @Qualifier(AuthUtils.JWT_ACCESS_TOKEN_DECODER)
    @Primary
    fun jwtAccessTokenDecoder(): JwtDecoder {
        return NimbusJwtDecoder
            .withPublicKey(keyUtils.userAccessTokenPublicKey)
            .build()
    }

    /**
     * JwtEncoder for user access tokens
     */
    @Bean(AuthUtils.JWT_ACCESS_TOKEN_ENCODER)
    @Qualifier(AuthUtils.JWT_ACCESS_TOKEN_ENCODER)
    @Primary
    fun jwtAccessTokenEncoder(): JwtEncoder {
        val jwk = RSAKey
            .Builder(keyUtils.userAccessTokenPublicKey)
            .privateKey(keyUtils.userAccessTokenPrivateKey)
            .build()

        return NimbusJwtEncoder(ImmutableJWKSet(JWKSet(jwk)))
    }

    /**
     * JwtDecoder for user refresh tokens
     */
    @Bean(AuthUtils.JWT_REFRESH_TOKEN_DECODER)
    @Qualifier(AuthUtils.JWT_REFRESH_TOKEN_DECODER)
    fun userJwtRefreshTokenDecoder(): JwtDecoder {
        return NimbusJwtDecoder
            .withPublicKey(keyUtils.userRefreshTokenPublicKey)
            .build()
    }

    /**
     * JwtEncoder for user refresh tokens
     */
    @Bean(AuthUtils.JWT_REFRESH_TOKEN_ENCODER)
    @Qualifier(AuthUtils.JWT_REFRESH_TOKEN_ENCODER)
    fun userJwtRefreshTokenEncoder(): JwtEncoder {
        val jwk = RSAKey
            .Builder(keyUtils.userRefreshTokenPublicKey)
            .privateKey(keyUtils.userRefreshTokenPrivateKey)
            .build()

        return NimbusJwtEncoder(ImmutableJWKSet(JWKSet(jwk)))
    }
}

@Component
class JwtToUserConverter(
    private val authService: AuthService
) : Converter<Jwt, UsernamePasswordAuthenticationToken?> {
    override fun convert(jwt: Jwt): UsernamePasswordAuthenticationToken {
        val authDetails = authService.getUserDetailsById(jwt.subject)

        return UsernamePasswordAuthenticationToken(authDetails, jwt, authDetails.authorities)
    }
}
