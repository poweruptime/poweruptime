package org.poweruptime.backend.features.profile.service

import jakarta.transaction.Transactional
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.user.domain.UserRepository
import org.springframework.stereotype.Service

@Service
class ProfileUserService(
    private val userRepository: UserRepository,
) {

    @Transactional
    fun updateEmail(user: User, email: String): User {
        user.email = email

        return userRepository.save(user)
    }
}
