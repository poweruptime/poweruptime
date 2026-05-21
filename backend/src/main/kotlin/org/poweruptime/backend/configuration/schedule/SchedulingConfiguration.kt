package org.poweruptime.backend.configuration.schedule

import io.github.oshai.kotlinlogging.KotlinLogging
import org.poweruptime.backend.core.utils.SECONDS_PER_DAY
import org.poweruptime.backend.features.authentication.service.OAuthLoginFlowService
import org.poweruptime.backend.features.info.supporter.SupporterService
import org.poweruptime.backend.features.info.versionChecker.service.VersionChecker
import org.poweruptime.backend.features.monitor.service.CheckResultLogEntryService
import org.poweruptime.backend.features.monitor.service.CheckResultService
import org.poweruptime.backend.features.notification.service.NotificationService
import org.poweruptime.backend.features.notification.service.SubNotificationService
import org.poweruptime.backend.features.team.service.TeamService
import org.poweruptime.backend.features.team.service.TeamSettingService
import org.poweruptime.backend.features.tempNotification.TempNotificationService
import org.springframework.context.annotation.Configuration
import org.springframework.scheduling.annotation.EnableScheduling
import org.springframework.scheduling.annotation.Scheduled
import java.time.Instant

@Configuration
@EnableScheduling
class SchedulingConfiguration(
    private val teamService: TeamService,
    private val teamSettingService: TeamSettingService,
    private val tempNotificationService: TempNotificationService,
    private val checkResultService: CheckResultService,
    private val checkResultLogEntryService: CheckResultLogEntryService,
    private val notificationService: NotificationService,
    private val subNotificationService: SubNotificationService,
    private val supporterService: SupporterService,
    private val versionChecker: VersionChecker,
    private val oAuthLoginFlowService: OAuthLoginFlowService,
) {
    private final val logger = KotlinLogging.logger {}

    // Runs 1 hour after instance start every 24 hours
    @Scheduled(fixedDelay = 86_400_000L, initialDelay = 3_600_000L)
    fun cleanup() {
        teamService.getAll().forEach { team ->
            val checkResultRetentionPeriodInDays = teamSettingService.getCheckResultRetentionPeriodInDays(team.id)
            val checkResultDateInPast = Instant.now().minusSeconds(
                SECONDS_PER_DAY * checkResultRetentionPeriodInDays.toLong(),
            )
            logger.info {
                "Removing subNotifications of team '${team.name}' (${team.id}) older than $checkResultDateInPast"
            }
            subNotificationService.deleteByTeamIdAndOlderThan(team.id, checkResultDateInPast)
            logger.info {
                "Removing notifications of team '${team.name}' (${team.id}) older than $checkResultDateInPast"
            }
            notificationService.deleteByTeamIdAndOlderThan(team.id, checkResultDateInPast)

            val checkResultLogRetentionPeriodInDays = teamSettingService.getCheckResultLogRetentionPeriodInDays(team.id)
            val checkResultLogDateInThePast = Instant.now().minusSeconds(
                SECONDS_PER_DAY * checkResultLogRetentionPeriodInDays.toLong(),
            )
            logger.info {
                "Removing check result logs of team '${team.name}' (${team.id}) older than $checkResultLogDateInThePast"
            }
            checkResultLogEntryService.deleteByTeamIdAndOlderThan(team.id, checkResultLogDateInThePast)

            logger.info {
                "Removing check results of team '${team.name}' (${team.id}) older than $checkResultDateInPast"
            }
            checkResultService.deleteByTeamIdAndOlderThan(team.id, checkResultDateInPast)
        }

        logger.info {
            "Checking instance support state ${supporterService.check()}"
        }
        logger.info {
            "Checking version ${versionChecker.checkAndSendNewVersionMail()}"
        }
    }

    // Runs 1 hour after instance start every 1 hour
    @Scheduled(fixedDelay = 3_600_000L, initialDelay = 3_600_000L)
    fun removeTempNotifications() {
        logger.info {
            "Removing old oauth login sessions"
        }
        oAuthLoginFlowService.cleanupExpiredSessions()

        tempNotificationService.removeOldTempNotifications()
    }
}
