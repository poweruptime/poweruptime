package org.poweruptime.backend.features.profile.service

import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.core.exceptions.ForbiddenException
import org.poweruptime.backend.core.exceptions.TooManyRequestsException
import org.poweruptime.backend.core.service.AEntityService
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.authentication.service.SessionService
import org.poweruptime.backend.features.mail.emails.EmailChangeNewEmail
import org.poweruptime.backend.features.mail.emails.EmailChangeOldEmail
import org.poweruptime.backend.features.mail.emails.EmailChangedEmail
import org.poweruptime.backend.features.mail.service.SystemEmailService
import org.poweruptime.backend.features.profile.domain.EmailChangeTokenRepository
import org.poweruptime.backend.features.profile.model.EmailChangeToken
import org.poweruptime.backend.features.user.service.UserService
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class EmailChangeTokenService(
    private val emailChangeTokenRepository: EmailChangeTokenRepository,
    private val systemEmailService: SystemEmailService,
    private val profileUserService: ProfileUserService,
    private val userService: UserService,
    private val sessionService: SessionService,
) : AEntityService<EmailChangeToken>(emailChangeTokenRepository) {

    fun create(user: User, email: String) {
        if (user.email == email) {
            throw BadRequestException("Email address needs to change")
        }

        if (emailChangeTokenRepository.countInvalidAndCreatedAfter(threeDaysAgo()) > 0) {
            throw TooManyRequestsException(
                "Email address can be changed only once in 3 days.",
                codeName = "email_already_changed",
            )
        }

        if (emailChangeTokenRepository.findByUserIdAndCreatedAfter(
                user.id,
                Instant.now().minusSeconds(60 * 60), // 1 hour
            ).size > 2
        ) {
            throw TooManyRequestsException()
        }

        if (userService.getByEmail(email) != null) {
            return
        }

        val confirmToken = save(EmailChangeToken(email, user))

        systemEmailService.queueEmail(
            EmailChangeOldEmail(user = user, cancelToken = confirmToken.id),
        )
        systemEmailService.queueEmail(
            EmailChangeNewEmail(user = user, newEmail = email, confirmToken = confirmToken.id),
        )
    }

    fun undo(token: String) {
        val emailChangeToken = emailChangeTokenRepository.findByTokenAndCreatedAfter(
            token,
            threeDaysAgo(),
        )?.apply {
            invalidateToken(this)
        } ?: throw ForbiddenException()

        val user = profileUserService.updateEmail(emailChangeToken.user, emailChangeToken.oldEmail)

        invalidateTokens(user.id, threeHoursAgo())
        sessionService.invalidateSessionsByUserId(user.id)
    }

    fun validateToken(token: String) {
        val emailChangeToken = emailChangeTokenRepository.findValidByTokenAndCreatedAfter(
            token,
            threeHoursAgo(),
        )?.apply {
            invalidateToken(this)
        } ?: throw ForbiddenException()

        if (emailChangeTokenRepository.countInvalidAndCreatedAfter(threeDaysAgo()) > 0) {
            throw TooManyRequestsException(
                "Email address can be changed only once in 3 days.",
                codeName = "email_already_changed",
            )
        }

        if (userService.getByEmail(emailChangeToken.email) != null) {
            return
        }

        val user = profileUserService.updateEmail(emailChangeToken.user, emailChangeToken.email)

        systemEmailService.queueEmail(
            EmailChangedEmail(user = user),
        )

        // Invalidate all other tokens created in the last 3 hours
        invalidateTokens(user.id, threeHoursAgo())
    }

    fun clearOlderThan(past: Instant) = emailChangeTokenRepository.findOlderThan(past).apply {
        deleteAll(this)
    }

    private fun threeHoursAgo() = Instant.now().minusSeconds(3 * 60 * 60)

    private fun threeDaysAgo() = Instant.now().minusSeconds(3 * 24 * 60 * 60)

    private fun invalidateTokens(userId: String, past: Instant) =
        saveAll(emailChangeTokenRepository.findByUserIdAndCreatedAfter(userId, past).onEach { it.touch() })

    private fun invalidateToken(resetToken: EmailChangeToken) = resetToken.let {
        it.touch()
        save(resetToken)
    }
}
