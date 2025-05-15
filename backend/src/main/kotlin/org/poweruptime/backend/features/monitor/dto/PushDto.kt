package org.poweruptime.backend.features.monitor.dto

import org.poweruptime.backend.features.notification.dto.NotificationResponse
import org.poweruptime.backend.features.notification.dto.SubNotificationResponse

enum class PushTypes {
    MONITOR, CHECK_RESULT, NOTIFICATION, SUB_NOTIFICATION
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

data class PushSubNotificationDto(
    override val type: PushTypes = PushTypes.SUB_NOTIFICATION,
    val subNotification: SubNotificationResponse,
) : PushDto
