package org.poweruptime.backend.configuration.schedule

import io.github.oshai.kotlinlogging.KotlinLogging
import org.poweruptime.backend.core.utils.SECONDS_PER_DAY
import org.poweruptime.backend.features.authentication.service.PasswordResetTokenService
import org.poweruptime.backend.features.authentication.service.SessionService
import org.poweruptime.backend.features.profile.service.EmailChangeTokenService
import org.poweruptime.backend.features.team.service.TeamJoinTokenService
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
    private final val logger = KotlinLogging.logger {}

    // Runs 30 minutes after instance start every 24 hours
    @Scheduled(fixedDelay = 86_400_000L, initialDelay = 1_800_000L)
    @Suppress("LongMethod")
    fun cleanup() {
        val dateNineMonthAgo = Instant.now().minusSeconds(SECONDS_PER_DAY * 30 * 9) // 9 months
        logger.info { "Removing sessions older than $dateNineMonthAgo" }

        for (session in sessionService.clearSessionsOlderThan(dateNineMonthAgo)) {
            logger.info {
                "Removed session '${session.id}' from user '${session.user.id}', last used at: '${session.updatedAt}'"
            }
        }

        val date1DayAgo = Instant.now().minusSeconds(SECONDS_PER_DAY * 1) // 1 day
        logger.info { "Removing reset password token older than $date1DayAgo" }
        for (resetToken in passwordResetTokenService.clearOlderThan(date1DayAgo)) {
            logger.info {
                "Removed reset token '${resetToken.id}' from user '${resetToken.user.id}', " +
                    "createdAt: '${resetToken.createdAt}'"
            }
        }

        val date3DayAgo = Instant.now().minusSeconds(SECONDS_PER_DAY * 3) // 3 days
        logger.info { "Removing email change token older than $date3DayAgo" }
        for (emailChangeToken in emailChangeTokenService.clearOlderThan(date3DayAgo)) {
            logger.info {
                "Removed email change token '${emailChangeToken.id}' from user '${emailChangeToken.user.id}', " +
                    "createdAt: '${emailChangeToken.createdAt}'"
            }
        }

        logger.info { "Removing team join token older than $date3DayAgo" }
        for (teamJoinToken in teamJoinTokenService.deleteOlderThan(date3DayAgo)) {
            logger.info {
                "Removed team join token '${teamJoinToken.id}' from invitee '${teamJoinToken.invitee.id}', " +
                    "into team '${teamJoinToken.team.id}' createdAt: '${teamJoinToken.createdAt}'"
            }
        }
    }
}
