package org.poweruptime.backend.features.monitor.dto

import org.poweruptime.backend.features.notification.dto.NotificationResponse

enum class PushTypes {
    MONITOR, CHECK_RESULT, NOTIFICATION
}

interface PushDto {
    val type: PushTypes
}

data class PushMonitorDto(
    override val type: PushTypes = PushTypes.MONITOR,
    val monitor: MonitorFullResponse,
) : PushDto

data class PushCheckResultDto(
    override val type: PushTypes = PushTypes.CHECK_RESULT,
    val checkResult: CheckResultResponse,
) : PushDto

data class PushNotificationDto(
    override val type: PushTypes = PushTypes.NOTIFICATION,
    val notification: NotificationResponse,
) : PushDto
