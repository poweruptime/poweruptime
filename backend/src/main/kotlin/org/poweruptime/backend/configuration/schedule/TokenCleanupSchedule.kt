package org.poweruptime.backend.configuration.schedule

import org.poweruptime.backend.core.utils.SECONDS_PER_DAY
import org.poweruptime.backend.features.authentication.service.PasswordResetTokenService
import org.poweruptime.backend.features.authentication.service.SessionService
import org.poweruptime.backend.features.profile.service.EmailChangeTokenService
import org.poweruptime.backend.features.team.service.TeamJoinTokenService
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Configuration
import org.springframework.scheduling.annotation.EnableScheduling
import org.springframework.scheduling.annotation.Scheduled
import java.time.Instant

@Configuration
@EnableScheduling
class TokenCleanupSchedule(
    private val sessionService: SessionService,
    private val passwordResetTokenService: PasswordResetTokenService,
    private val teamJoinTokenService: TeamJoinTokenService,
    private val emailChangeTokenService: EmailChangeTokenService,
) {
    val logger: Logger = LoggerFactory.getLogger(TokenCleanupSchedule::class.java)

    // Runs 30 minutes after instance start every 24 hours
    @Scheduled(fixedDelay = 86_400_000L, initialDelay = 1_800_000L)
    @Suppress("LongMethod")
    fun cleanup() {
        val dateNineMonthAgo = Instant.now().minusSeconds(SECONDS_PER_DAY * 30 * 9) // 9 months
        logger.info("Removing sessions older than $dateNineMonthAgo")

        for (session in sessionService.clearSessionsOlderThan(dateNineMonthAgo)) {
            logger.info(
                "Removed session '{}' from user '{}', last used at: '{}'",
                session.id,
                session.user.id,
                session.updatedAt,
            )
        }

        val date1DayAgo = Instant.now().minusSeconds(60 * 60 * 24 * 1) // 1 day
        logger.info("Removing reset password token older than $date1DayAgo")
        for (resetToken in passwordResetTokenService.clearOlderThan(date1DayAgo)) {
            logger.info(
                "Removed reset token '{}' from user '{}', createdAt: '{}'",
                resetToken.id,
                resetToken.user.id,
                resetToken.createdAt,
            )
        }

        logger.info("Removing email change token older than $date1DayAgo")
        for (emailChangeToken in emailChangeTokenService.clearOlderThan(date1DayAgo)) {
            logger.info(
                "Removed email change token '{}' from user '{}', createdAt: '{}'",
                emailChangeToken.id,
                emailChangeToken.user.id,
                emailChangeToken.createdAt,
            )
        }

        val date3DayAgo = Instant.now().minusSeconds(SECONDS_PER_DAY * 3) // 3 days
        logger.info("Removing team join token older than $date3DayAgo")
        for (teamJoinToken in teamJoinTokenService.deleteOlderThan(date3DayAgo)) {
            logger.info(
                "Removed team join token '{}' from invitee '{}', into team '{}' createdAt: '{}'",
                teamJoinToken.id,
                teamJoinToken.invitee.id,
                teamJoinToken.team.id,
                teamJoinToken.createdAt,
            )
        }
    }
}
