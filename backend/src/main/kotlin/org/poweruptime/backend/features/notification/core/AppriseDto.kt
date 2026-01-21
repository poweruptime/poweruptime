package org.poweruptime.backend.features.notification.core

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonValue

enum class AppriseNotificationType(val value: String) {
    INFO("info"),
    WARNING("warning"),
    FAILURE("failure"),
    ;

    @JsonValue
    fun toValue(): String = value

    companion object {
        @JvmStatic
        @JsonCreator
        fun fromValue(value: String): AppriseNotificationType = entries.firstOrNull { it.value == value }
            ?: throw IllegalArgumentException(
                "Unknown NotificationType: $value",
            )
    }
}

enum class AppriseNotificationFormat(val value: String) {
    TEXT("text"),
    MARKDOWN("markdown"),
    HTML("html"),
    ;

    @JsonValue
    fun toValue(): String = value

    companion object {
        @JvmStatic
        @JsonCreator
        fun fromValue(value: String): AppriseNotificationFormat = entries.firstOrNull { it.value == value }
            ?: throw IllegalArgumentException(
                "Unknown NotificationFormat: $value",
            )
    }
}

data class AppriseNotificationRequest(
    val urls: List<String>,
    val body: String,
    val title: String? = null,
    val type: AppriseNotificationType = AppriseNotificationType.INFO,
    val format: AppriseNotificationFormat = AppriseNotificationFormat.HTML,
)

data class NotificationMethodDataAppriseDto(val url: String, val extras: Map<String, String>? = null)
