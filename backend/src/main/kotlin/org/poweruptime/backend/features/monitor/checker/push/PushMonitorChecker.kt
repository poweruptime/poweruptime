package org.poweruptime.backend.features.monitor.checker.push

import io.github.oshai.kotlinlogging.KotlinLogging
import org.poweruptime.backend.core.utils.DateTimeUtils
import org.poweruptime.backend.features.monitor.core.*
import org.poweruptime.backend.features.monitor.domain.IPushMonitorCheckerEntryRepository
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.MonitorType
import org.poweruptime.backend.features.team.service.TeamSettingService
import java.time.Instant

class PushMonitorChecker(
    private val pushMonitorCheckerEntryRepository: IPushMonitorCheckerEntryRepository,
    private val teamSettingService: TeamSettingService
) : MonitorChecker {
    private final val logger = KotlinLogging.logger {}

    override val type = MonitorType.PUSH

    override fun execute(monitor: Monitor): CheckResultDto {
        val pushMonitorCheckerData = monitor.checker as PushMonitorData

        logger.debug {
            "Checking for push request for monitor '${monitor.name}' with id '${monitor.id}', " +
                "push id: '${pushMonitorCheckerData.pushId}'"
        }

        val since = Instant.now().minusSeconds(monitor.testIntervalSeconds)

        val result = MonitoringResultHandler()

        val entry = pushMonitorCheckerEntryRepository.getLatestByPushIdAndBetweenNowAndThen(
            pushMonitorCheckerData.pushId, since,
        ) ?: return result.error(
            "No push detected since last run",
            "No push since: ${
                since
                    .atZone(teamSettingService.getTimeZone(monitor.team.id))
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
