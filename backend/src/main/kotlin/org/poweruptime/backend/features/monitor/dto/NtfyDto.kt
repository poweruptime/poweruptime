package org.poweruptime.backend.features.monitor.dto

import org.poweruptime.backend.features.notification.dto.NotificationResponse

interface NtfyDto

data class NtfyMonitorDto(
    val monitor: MonitorFullResponse,
) : NtfyDto

data class NtfyCheckResultDto(
    val checkResult: CheckResultResponse,
) : NtfyDto

data class NtfyNotificationDto(
    val notification: NotificationResponse,
) : NtfyDto
