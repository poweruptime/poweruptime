package org.poweruptime.backend.features.monitor.checkers.push

import io.github.oshai.kotlinlogging.KotlinLogging
import org.poweruptime.backend.core.utils.DateTimeUtils
import org.poweruptime.backend.features.monitor.checkers.CheckResultDto
import org.poweruptime.backend.features.monitor.checkers.MonitorChecker
import org.poweruptime.backend.features.monitor.checkers.MonitoringResultHandler
import org.poweruptime.backend.features.monitor.core.MonitorData
import org.poweruptime.backend.features.monitor.domain.IPushMonitorCheckerEntryRepository
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.MonitorType
import org.poweruptime.backend.features.team.service.TeamSettingService
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

open class PushMonitorChecker(
    private val pushMonitorCheckerEntryRepository: IPushMonitorCheckerEntryRepository,
    private val teamSettingService: TeamSettingService,
) : MonitorChecker(MonitorType.PUSH) {
    private final val logger = KotlinLogging.logger {}

    @Transactional
    override fun execute(monitor: MonitorRecord, data: MonitorData): CheckResultDto {
        data as PushMonitorDataRecord

        logger.debug {
            "Checking for push request for monitor '${monitor.name}' with id '${monitor.id}', " +
                "push id: '${data.pushId}'"
        }

        val since = Instant.now().minusSeconds(monitor.testIntervalSeconds)

        val result = MonitoringResultHandler()

        val entry = pushMonitorCheckerEntryRepository.getLatestByPushIdAndBetweenNowAndThen(
            pushId = data.pushId,
            then = since,
        ) ?: return result.error(
            "No push detected since last run",
            "No push since: ${
                since
                    .atZone(teamSettingService.getTimeZone(monitor.teamId))
                    .format(DateTimeUtils.simpleDateTimeFormatter)
            } (${monitor.testIntervalSeconds} seconds)",
        )

        return if (entry.status == MonitorStatus.UP) {
            result.success(entry.title, entry.message, entry.pingMs)
        } else {
            result.error(entry.title, entry.message, entry.pingMs)
        }
    }
}
