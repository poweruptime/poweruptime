package org.poweruptime.backend.features.authentication.service

import org.springframework.security.core.userdetails.UserDetailsService

class AuthDetailsService(private val authService: AuthService) : UserDetailsService {
    override fun loadUserByUsername(username: String) = authService.getUserDetailsById(username) // username is user id
}
