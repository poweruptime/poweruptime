package org.poweruptime.backend.features.notification.core

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonValue

enum class NotificationType(val value: String) {
    INFO("info"),
    WARNING("warning"),
    FAILURE("failure");

    @JsonValue
    fun toValue(): String = value

    companion object {
        @JvmStatic
        @JsonCreator
        fun fromValue(value: String): NotificationType =
            entries.firstOrNull { it.value == value }
                ?: throw IllegalArgumentException(
                    "Unknown NotificationType: $value",
                )
    }
}

enum class NotificationFormat(val value: String) {
    TEXT("text"),
    MARKDOWN("markdown"),
    HTML("html");

    @JsonValue
    fun toValue(): String = value

    companion object {
        @JvmStatic
        @JsonCreator
        fun fromValue(value: String): NotificationFormat =
            entries.firstOrNull { it.value == value }
                ?: throw IllegalArgumentException(
                    "Unknown NotificationFormat: $value",
                )
    }
}

data class AppriseNotificationRequest(
    val urls: List<String>,
    val body: String,
    val title: String? = null,
    val type: NotificationType = NotificationType.INFO,
    val format: NotificationFormat = NotificationFormat.HTML,
)

data class NotificationMethodDataAppriseDto(
    val url: String,
    val extras: Map<String, String>? = null,
)
