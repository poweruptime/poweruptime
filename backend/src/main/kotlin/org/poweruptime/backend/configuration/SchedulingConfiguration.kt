package org.poweruptime.backend.configuration

import org.poweruptime.backend.features.authentication.service.PasswordResetTokenService
import org.poweruptime.backend.features.authentication.service.SessionService
import org.poweruptime.backend.features.fileUpload.FileService
import org.poweruptime.backend.features.monitor.service.CheckResultLogEntryService
import org.poweruptime.backend.features.monitor.service.CheckResultService
import org.poweruptime.backend.features.profile.service.EmailChangeTokenService
import org.poweruptime.backend.features.team.service.TeamJoinTokenService
import org.poweruptime.backend.features.team.service.TeamService
import org.poweruptime.backend.features.team.service.TeamSettingService
import org.poweruptime.backend.features.tempNotification.TempNotificationService
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Configuration
import org.springframework.scheduling.annotation.EnableScheduling
import org.springframework.scheduling.annotation.Scheduled
import java.time.Instant

@Configuration
@EnableScheduling
class SchedulingConfiguration(
    private val sessionService: SessionService,
    private val passwordResetTokenService: PasswordResetTokenService,
    private val teamJoinTokenService: TeamJoinTokenService,
    private val tempNotificationService: TempNotificationService,
    private val checkResultService: CheckResultService,
    private val checkResultLogEntryService: CheckResultLogEntryService,
    private val emailChangeTokenService: EmailChangeTokenService,
    private val teamService: TeamService,
    private val teamSettingService: TeamSettingService,
    private val fileService: FileService
) {
    val logger: Logger = LoggerFactory.getLogger(SchedulingConfiguration::class.java)

    // Runs 30 minutes after instance start every 24 hours
    @Scheduled(fixedDelay = 86_400_000L, initialDelay = 1_800_000L)
    @Suppress("LongMethod")
    fun cleanup() {
        val dateNineMonthAgo = Instant.now().minusSeconds(60 * 60 * 24 * 30 * 9) // 9 months
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

        val date3DayAgo = Instant.now().minusSeconds(60 * 60 * 24 * 3) // 3 days
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

        logger.info("Removing tangling files older than $date3DayAgo")
        for (file in fileService.deleteOlderThan(date3DayAgo)) {
            logger.info(
                "Removed file '{}', fileId: '{}', createdAt: '{}'",
                file.id,
                file.fileId,
                file.createdAt,
            )
        }

        teamService.getAll().forEach { team ->
            val checkResultRetentionPeriodInDays = teamSettingService.getCheckResultRetentionPeriodInDays(team.id)
            val checkResultDateInThePast = Instant.now().minusSeconds(
                60 * 60 * 24 * checkResultRetentionPeriodInDays.toLong(),
            )
            logger.info(
                """Removing check results of team "${team.name}" (${team.id}) older than $checkResultDateInThePast""",
            )
            checkResultService.deleteByTeamIdAndOlderThan(team.id, checkResultDateInThePast)

            val checkResultLogRetentionPeriodInDays = teamSettingService.getCheckResultLogRetentionPeriodInDays(team.id)
            val checkResultLogDateInThePast = Instant.now().minusSeconds(
                60 * 60 * 24 * checkResultLogRetentionPeriodInDays.toLong(),
            )
            logger.info(
                """Removing check result logs of team "${team.name}" (${team.id}) older
                    |than $checkResultLogDateInThePast
                """.trimMargin(),
            )
            checkResultLogEntryService.deleteByTeamIdAndOlderThan(team.id, checkResultLogDateInThePast)
        }
    }

    // Runs 1 hour after instance start every 1 hour
    @Scheduled(fixedDelay = 3_600_000L, initialDelay = 3_600_000L)
    fun removeTempNotifications() {
        tempNotificationService.removeOldTempNotifications()
    }
}
