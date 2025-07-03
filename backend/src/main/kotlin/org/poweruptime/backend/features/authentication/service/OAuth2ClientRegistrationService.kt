package org.poweruptime.backend.features.authentication.service

import org.springframework.security.oauth2.client.registration.ClientRegistration
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository
import org.springframework.stereotype.Service

@Service
class OAuth2ClientRegistrationService(
    private val clientRegistrationRepository: ClientRegistrationRepository
) {
    fun getProviders(): List<ClientRegistration> = (clientRegistrationRepository as? Iterable<*>)
        ?.filterIsInstance<ClientRegistration>()
        ?: emptyList()
}
