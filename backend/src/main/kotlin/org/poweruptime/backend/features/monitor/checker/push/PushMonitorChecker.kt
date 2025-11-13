package org.poweruptime.backend.features.monitor.checker.push

import io.github.oshai.kotlinlogging.KotlinLogging
import org.poweruptime.backend.core.utils.DateTimeUtils
import org.poweruptime.backend.features.monitor.core.*
import org.poweruptime.backend.features.monitor.domain.IPushMonitorCheckerEntryRepository
import org.poweruptime.backend.features.monitor.model.MonitorData
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.MonitorType
import org.poweruptime.backend.features.team.service.TeamSettingService
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

class PushMonitorChecker(
    private val repository: IPushMonitorCheckerEntryRepository,
    private val teamSettingService: TeamSettingService,
) : MonitorChecker {
    private final val logger = KotlinLogging.logger {}

    override val type = MonitorType.PUSH

    @Transactional
    override fun execute(monitor: MonitorRecord, data: MonitorData): CheckResultDto {
        data as PushMonitorDataRecord

        logger.debug {
            "Checking for push request for monitor '${monitor.name}' with id '${monitor.id}', " +
                "push id: '${data.pushId}'"
        }

        val since = Instant.now().minusSeconds(monitor.testIntervalSeconds)

        val result = MonitoringResultHandler()

        val entry = repository.getLatestByPushIdAndBetweenNowAndThen(
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
