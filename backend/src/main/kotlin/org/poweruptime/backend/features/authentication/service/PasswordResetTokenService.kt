package org.poweruptime.backend.features.authentication.service

import org.poweruptime.backend.core.service.AEntityService
import org.poweruptime.backend.features.authentication.domain.PasswordResetTokenRepository
import org.poweruptime.backend.features.authentication.model.PasswordResetToken
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.mail.emails.PasswordResetEmail
import org.poweruptime.backend.features.mail.service.SystemEmailService
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class PasswordResetTokenService(
    val passwordResetTokenRepository: PasswordResetTokenRepository,
    val systemEmailService: SystemEmailService
) : AEntityService<PasswordResetToken>(passwordResetTokenRepository) {

    fun create(user: User) {
        if (passwordResetTokenRepository.countByUserIdAndCreatedAfter(
                user.id,
                Instant.now().minusSeconds(60 * 60), // 1 hour
            ) > 2
        ) {
            return
        }

        val resetToken = save(PasswordResetToken(user))

        systemEmailService.queueEmail(
            PasswordResetEmail(email = user.email, resetToken = resetToken.id, name = user.name),
        )
    }

    fun validateToken(userId: String, token: String) =
        passwordResetTokenRepository.findValidByUserIdTokenAndCreatedAfter(
            userId,
            token,
            Instant.now().minusSeconds(3 * 60 * 60), // 3 hours
        )?.apply {
            invalidateToken(this)
        }

    fun clearOlderThan(past: Instant) = passwordResetTokenRepository.findOlderThan(past).apply {
        deleteAll(this)
    }

    private fun invalidateToken(resetToken: PasswordResetToken) = resetToken.let {
        it.touch()
        save(resetToken)
    }
}
