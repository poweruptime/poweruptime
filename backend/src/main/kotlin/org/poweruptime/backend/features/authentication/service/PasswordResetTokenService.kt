package org.poweruptime.backend.features.authentication.service

import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.poweruptime.backend.features.authentication.domain.countByUserIdAndCreatedAfter
import org.poweruptime.backend.features.authentication.domain.deleteOlderThan
import org.poweruptime.backend.features.authentication.domain.invalidateByUserIdTokenAndCreatedAfter
import org.poweruptime.backend.features.authentication.model.PasswordResetToken
import org.poweruptime.backend.features.authentication.model.UserRecord
import org.poweruptime.backend.features.mail.emails.PasswordResetEmail
import org.poweruptime.backend.features.mail.service.SystemEmailService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

const val THREE_HOURS_IN_SECONDS = 3L * 60L * 60L

@Service
@Transactional
class PasswordResetTokenService(
    val systemEmailService: SystemEmailService
) {

    fun create(user: UserRecord) {
        if (PasswordResetToken.countByUserIdAndCreatedAfter(
                user.id,
                Instant.now().minusSeconds(60 * 60), // 1 hour
            ) > 2
        ) {
            return
        }

        val resetToken = PasswordResetToken.insertAndGetId {
            it[PasswordResetToken.userId] = user.id
        }.value

        systemEmailService.queueEmail(
            PasswordResetEmail(user, resetToken = resetToken),
        )
    }

    fun validateToken(userId: ULong, token: String): Boolean =
        PasswordResetToken.invalidateByUserIdTokenAndCreatedAfter(
            userId,
            token,
            Instant.now().minusSeconds(THREE_HOURS_IN_SECONDS), // 3 hours
        ) == 1

    fun clearOlderThan(past: Instant): Int = PasswordResetToken.deleteOlderThan(past)
}
