package org.poweruptime.backend.features.authentication.config

import io.github.oshai.kotlinlogging.KotlinLogging
import org.poweruptime.backend.core.utils.capitalize
import org.springframework.boot.autoconfigure.security.oauth2.client.OAuth2ClientProperties
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider
import org.springframework.security.oauth2.client.registration.ClientRegistration
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository
import org.springframework.security.oauth2.core.AuthorizationGrantType

@Configuration
@EnableConfigurationProperties(OAuth2ClientProperties::class)
class OAuth2ClientRegistrationsConfig(
    private val props: OAuth2ClientProperties
) {
    private val log = KotlinLogging.logger {}

    @Bean
    fun clientRegistrationRepository(): ClientRegistrationRepository {
        val registrations = props.registration
            .filter { (_, registration) -> registration.clientId != "EMPTY" && registration.clientSecret != "EMPTY" }
            .mapNotNull { (registrationId, registration) ->
                when (registrationId) {
                    "google" ->
                        CommonOAuth2Provider.GOOGLE
                            .getBuilder(registrationId)
                            .clientId(registration.clientId!!)
                            .clientSecret(registration.clientSecret!!)
                            .scope(*registration.scope.toTypedArray())
                            .redirectUri(registration.redirectUri ?: "{baseUrl}/login/oauth2/code/$registrationId")
                            .build()

                    else -> {
                        // treat as a “custom” OIDC provider (Keycloak, etc.)
                        val provider = props.provider[registrationId]
                        if (provider?.issuerUri.isNullOrBlank()) {
                            // no issuerUri → skip
                            null
                        } else {
                            ClientRegistration
                                .withRegistrationId(registrationId)
                                .clientId(registration.clientId!!)
                                .clientSecret(registration.clientSecret!!)
                                .authorizationGrantType(AuthorizationGrantType(registration.authorizationGrantType))
                                .redirectUri(registration.redirectUri ?: "{baseUrl}/login/oauth2/code/$registrationId")
                                .clientName(registration.clientName ?: registrationId.capitalize())
                                .scope(*registration.scope.toTypedArray())
                                .authorizationUri(provider.authorizationUri)
                                .issuerUri(provider.issuerUri)
                                .jwkSetUri(provider.jwkSetUri)
                                .tokenUri(provider.tokenUri)
                                .userInfoUri(provider.userInfoUri)
                                .userNameAttributeName(provider.userNameAttribute ?: "sub")
                                .build()
                        }
                    }
                }
            }

        registrations.forEach {
            log.info { "registering OAuth2 client '${it.registrationId}' (${it.clientId})" }
        }

        return if (registrations.isEmpty()) {
            EmptyClientRegistrationRepository()
        } else {
            InMemoryClientRegistrationRepository(
                registrations,
            )
        }
    }
}

class EmptyClientRegistrationRepository(
    registrations: List<ClientRegistration> = emptyList()
) : ClientRegistrationRepository, Iterable<ClientRegistration> {

    private val registrations: Map<String, ClientRegistration> =
        registrations.associateBy { it.registrationId }

    override fun findByRegistrationId(registrationId: String): ClientRegistration? =
        registrations[registrationId]

    override fun iterator(): Iterator<ClientRegistration> =
        registrations.values.iterator()
}
