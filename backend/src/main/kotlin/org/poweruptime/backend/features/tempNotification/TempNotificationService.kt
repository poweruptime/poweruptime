package org.poweruptime.backend.features.tempNotification

import org.poweruptime.backend.core.utils.RandomGenerator
import org.poweruptime.backend.features.notification.core.AppriseNotificationRequest
import org.springframework.stereotype.Service
import java.time.Instant

data class TempNotification(
    val id: String = RandomGenerator.nanoId(),
    val url: String = "http://localhost:8080/api/v1/public/temp-notification/$id",
    val createdAt: Instant = Instant.now(),
    val to: String,
    val subject: String,
    val body: String? = null,
    val bodyHTML: String? = null,
    val appriseDto: AppriseNotificationRequest? = null
)

@Service
class TempNotificationService {
    var tempNotifications: MutableList<TempNotification> = mutableListOf()

    fun addNotification(tempNotification: TempNotification) = tempNotifications.add(0, tempNotification)

    fun addNotifications(tempNotifications: List<TempNotification>) =
        this.tempNotifications.addAll(0, tempNotifications)

    fun getAll() = tempNotifications

    fun removeOldTempNotifications() {
        val date1HourAgo = Instant.now().minusSeconds(60 * 60)
        tempNotifications = tempNotifications.filter { it.createdAt > date1HourAgo }.toMutableList()
    }

    fun removeAll() {
        tempNotifications = mutableListOf()
    }
}
