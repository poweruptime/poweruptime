package org.poweruptime.backend.features.monitor.service

import org.poweruptime.backend.core.utils.Config
import org.poweruptime.backend.core.utils.createBasicAuthString
import org.poweruptime.backend.features.monitor.dto.*
import org.poweruptime.backend.features.monitor.model.CheckResult
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.TimeOption
import org.poweruptime.backend.features.notification.dto.NotificationResponse
import org.poweruptime.backend.features.notification.model.Notification
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate

@Service
class NtfyPushSender(
    @Value(Config.NTFY_ADMIN_PASSWORD) private val ntfyAdminPassword: String = "",
    private val rest: RestTemplate,
    private val checkResultService: CheckResultService,
) {
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

    private fun send(topic: String, dto: NtfyDto): String = try {
        rest.exchange(
            "http://localhost:8085/$topic",
            HttpMethod.POST,
            HttpEntity(
                dto,
                HttpHeaders().createBasicAuthString("admin", ntfyAdminPassword),
            ),
            Any::class.java,
        )
        "Success"
    } catch (e: Throwable) {
        e.message ?: "Unknown error"
    }

    private fun Monitor.toFullResponse() = MonitorFullResponse(
        this,
        uptime = checkResultService.uptimeStatisticsDto(this),
        lastCheckResults = checkResultService.getLastByMonitorId(this.id, 20),
        oneDayUptime = checkResultService.calculateRecentUptime(this.id, TimeOption.ONE_DAY).myFormat(),
    )
}
