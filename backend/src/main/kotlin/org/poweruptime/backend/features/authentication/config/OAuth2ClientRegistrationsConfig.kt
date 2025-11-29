package org.poweruptime.backend.features.authentication.config

import io.github.oshai.kotlinlogging.KotlinLogging
import org.poweruptime.backend.core.utils.capitalize
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.security.oauth2.client.autoconfigure.OAuth2ClientProperties
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
        val registrations = loadClientRegistrations()

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

    fun loadClientRegistrations(): List<ClientRegistration> = props.registration
        .filter { (_, registration) ->
            !registration.clientId.isNullBlankOrEmpty() && !registration.clientSecret.isNullBlankOrEmpty()
        }.mapNotNull { (registrationId, registration) ->
            try {
                when (registrationId) {
                    "google" ->
                        CommonOAuth2Provider.GOOGLE
                            .getBuilder(registrationId)
                            .clientId(registration.clientId!!)
                            .clientSecret(registration.clientSecret!!)
                            .scope(*registration.scope!!.toTypedArray())
                            .redirectUri(registration.redirectUri ?: "{baseUrl}/login/oauth2/code/$registrationId")
                            .build()

                    else -> props.provider[registrationId]?.let {
                        if (
                            it.authorizationUri.isNullBlankOrEmpty() ||
                            it.issuerUri.isNullBlankOrEmpty() ||
                            it.jwkSetUri.isNullBlankOrEmpty() ||
                            it.tokenUri.isNullBlankOrEmpty() ||
                            it.userInfoUri.isNullBlankOrEmpty() ||
                            it.userNameAttribute.isNullBlankOrEmpty()
                        ) {
                            return@let null
                        }

                        ClientRegistration
                            .withRegistrationId(registrationId)
                            .clientId(registration.clientId!!)
                            .clientSecret(registration.clientSecret!!)
                            .authorizationGrantType(
                                AuthorizationGrantType(registration.authorizationGrantType),
                            )
                            .redirectUri(
                                registration.redirectUri ?: "{baseUrl}/login/oauth2/code/$registrationId",
                            )
                            .clientName(registration.clientName ?: registrationId.capitalize())
                            .scope(*registration.scope!!.toTypedArray())
                            .authorizationUri(it.authorizationUri)
                            .issuerUri(it.issuerUri)
                            .jwkSetUri(it.jwkSetUri)
                            .tokenUri(it.tokenUri)
                            .userInfoUri(it.userInfoUri)
                            .userNameAttributeName(it.userNameAttribute ?: "sub")
                            .build()
                    }
                }
            } catch (e: Exception) {
                log.error(e) { "Failed to register client $registrationId" }
                null
            }
        }
}

private fun String?.isNullBlankOrEmpty() = this.isNullOrBlank() || this == "EMPTY"

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
