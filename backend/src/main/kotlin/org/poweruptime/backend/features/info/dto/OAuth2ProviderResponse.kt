package org.poweruptime.backend.features.info.dto

import org.springframework.security.oauth2.client.registration.ClientRegistration

data class OAuth2ProviderResponse(val registrationId: String, val clientName: String, val clientId: String) {
    constructor(clientRegistration: ClientRegistration) : this(
        clientRegistration.registrationId,
        clientRegistration.clientName,
        clientRegistration.clientId,
    )
}
