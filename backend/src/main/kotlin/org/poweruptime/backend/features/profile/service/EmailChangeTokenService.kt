package org.poweruptime.backend.features.profile.service

import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.less
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.domain.findByIdOrThrow
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.core.exceptions.ForbiddenException
import org.poweruptime.backend.core.exceptions.TooManyRequestsException
import org.poweruptime.backend.features.authentication.model.UserRecord
import org.poweruptime.backend.features.authentication.service.SessionService
import org.poweruptime.backend.features.mail.emails.EmailChangeNewEmail
import org.poweruptime.backend.features.mail.emails.EmailChangeOldEmail
import org.poweruptime.backend.features.mail.emails.EmailChangedEmail
import org.poweruptime.backend.features.mail.service.SystemEmailService
import org.poweruptime.backend.features.profile.EmailChangeTokenRecord
import org.poweruptime.backend.features.profile.EmailChangeTokenTable
import org.poweruptime.backend.features.profile.countInvalidByUserIdAndCreatedAfter
import org.poweruptime.backend.features.profile.findByTokenAndCreatedAfter
import org.poweruptime.backend.features.profile.findByUserIdAndCreatedAfter
import org.poweruptime.backend.features.profile.findValidByTokenAndCreatedAfter
import org.poweruptime.backend.features.profile.rowToEmailChangeTokenRecord
import org.poweruptime.backend.features.user.service.UserService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
@Transactional(readOnly = true)
class EmailChangeTokenService(
    private val systemEmailService: SystemEmailService,
    private val profileUserService: ProfileUserService,
    private val userService: UserService,
    private val sessionService: SessionService,
) {

    @Transactional
    fun create(user: UserRecord, email: String) {
        if (user.email == email) {
            throw BadRequestException("Email address needs to change")
        }

        if (EmailChangeTokenTable.countInvalidByUserIdAndCreatedAfter(user.id, threeDaysAgo()) > 0) {
            throw TooManyRequestsException(
                "Email address can be changed only once in 3 days.",
                codeName = "email_already_changed",
            )
        }

        if (EmailChangeTokenTable.findByUserIdAndCreatedAfter(
                user.id,
                Instant.now().minusSeconds(60 * 60), // 1 hour
            ).size > 2
        ) {
            throw TooManyRequestsException()
        }

        if (userService.findByEmail(email) != null) {
            return
        }

        val confirmToken = EmailChangeTokenTable.insertAndGetId {
            it[EmailChangeTokenTable.email] = email
            it[EmailChangeTokenTable.userId] = user.id
            it[EmailChangeTokenTable.oldEmail] = user.email
        }.let { id ->
            EmailChangeTokenTable.findByIdOrThrow(id.value) {
                EmailChangeTokenTable.rowToEmailChangeTokenRecord(it)
            }
        }

        systemEmailService.queueEmail(
            EmailChangeOldEmail(user = user, cancelToken = confirmToken.publicId),
        )
        systemEmailService.queueEmail(
            EmailChangeNewEmail(user = user, newEmail = email, confirmToken = confirmToken.publicId),
        )
    }

    @Transactional
    fun undo(token: String) {
        val emailChangeToken = EmailChangeTokenTable.findByTokenAndCreatedAfter(
            token,
            threeDaysAgo(),
        )?.invalidate() ?: throw ForbiddenException()

        val user = profileUserService.updateEmail(emailChangeToken.userId, emailChangeToken.oldEmail)

        invalidateTokensOlderThan(user.id, threeHoursAgo())
        sessionService.invalidateSessionsByUserId(user.id)
    }

    @Transactional
    fun validateToken(token: String) {
        val emailChangeToken = EmailChangeTokenTable.findValidByTokenAndCreatedAfter(
            token,
            threeHoursAgo(),
        )?.invalidate() ?: throw ForbiddenException()

        if (EmailChangeTokenTable.countInvalidByUserIdAndCreatedAfter(emailChangeToken.userId, threeDaysAgo()) > 0) {
            throw TooManyRequestsException(
                "Email address can be changed only once in 3 days.",
                codeName = "email_already_changed",
            )
        }

        if (userService.findByEmail(emailChangeToken.email) != null) {
            return
        }

        val user = profileUserService.updateEmail(emailChangeToken.userId, emailChangeToken.email)

        systemEmailService.queueEmail(
            EmailChangedEmail(user = user),
        )

        // Invalidate all other tokens created in the last 3 hours
        invalidateTokensOlderThan(user.id, threeHoursAgo())
    }

    @Transactional
    fun clearOlderThan(before: Instant) {
        EmailChangeTokenTable.deleteWhere { EmailChangeTokenTable.createdAt less before }
    }

    private fun threeHoursAgo() = Instant.now().minusSeconds(3 * 60 * 60)

    private fun threeDaysAgo() = Instant.now().minusSeconds(3 * 24 * 60 * 60)

    @Transactional
    private fun invalidateTokensOlderThan(userId: ULong, createdAfter: Instant) {
        EmailChangeTokenTable.update({
            (EmailChangeTokenTable.userId eq userId) and (EmailChangeTokenTable.createdAt less createdAfter)
        }) {
            it[EmailChangeTokenTable.valid] = false
        }
    }

    @Transactional
    private fun EmailChangeTokenRecord.invalidate(): EmailChangeTokenRecord {
        EmailChangeTokenTable.update({ EmailChangeTokenTable.id eq id }) {
            it[EmailChangeTokenTable.valid] = false
        }

        return this
    }
}
