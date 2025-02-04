package org.poweruptime.backend.features.monitor.service

import org.poweruptime.backend.core.utils.Config
import org.poweruptime.backend.core.utils.createBasicAuthString
import org.poweruptime.backend.features.monitor.dto.*
import org.poweruptime.backend.features.monitor.model.CheckResult
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.TimeOption
import org.poweruptime.backend.features.notification.dto.NotificationResponse
import org.poweruptime.backend.features.notification.model.Notification
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate

@Service
class NtfyPushSender(
    @Value(Config.NTFY_ENABLED) private val ntfyEnabled: Boolean = false,
    @Value(Config.NTFY_HOST) private val ntfyHost: String = "",
    @Value(Config.NTFY_USER) private val ntfyUser: String = "",
    @Value(Config.NTFY_PASSWORD) private val ntfyAdmin: String = "",
    private val rest: RestTemplate,
    private val checkResultService: CheckResultService,
) {
    private val logger = LoggerFactory.getLogger(NtfyPushSender::class.java)

    fun sendNewCheckResult(teamId: String, checkResult: CheckResult) = send(
        "pu_t_c_$teamId",
        NtfyCheckResultDto(checkResult = CheckResultResponse(checkResult)),
    )

    fun sendNewNotification(teamId: String, notification: Notification) = send(
        "pu_t_n_$teamId",
        NtfyNotificationDto(notification = NotificationResponse(notification)),
    )

    fun sendMonitorStatusChange(teamId: String, monitor: Monitor) = send(
        "pu_t_m_$teamId",
        NtfyMonitorDto(monitor = monitor.toFullResponse()),
    )

    private fun send(topic: String, dto: NtfyDto): String =
        if (ntfyEnabled) {
            try {
                rest.exchange(
                    "$ntfyHost/$topic",
                    HttpMethod.POST,
                    HttpEntity(
                        dto,
                        HttpHeaders().createBasicAuthString(ntfyUser, ntfyAdmin),
                    ),
                    Any::class.java,
                )
                "Success"
            } catch (e: Throwable) {
                logger.error("""Could not send ntfy message to server "{}" and topics "{}"""", ntfyHost, topic)
                e.message ?: "Unknown error"
            }
        } else {
            "Success"
        }

    private fun Monitor.toFullResponse() = MonitorFullResponse(
        this,
        uptime = checkResultService.uptimeStatisticsDto(this),
        lastCheckResults = checkResultService.getLastByMonitorId(this.id, 20),
        oneDayUptime = checkResultService.calculateRecentUptime(this.id, TimeOption.ONE_DAY).myFormat(),
    )
}
