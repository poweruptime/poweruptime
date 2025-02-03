package org.poweruptime.backend.features.tempNotification

import io.swagger.v3.oas.annotations.tags.Tag
import org.poweruptime.backend.core.exceptions.NotFoundException
import org.poweruptime.backend.core.utils.Config
import org.springframework.beans.factory.annotation.Value
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/public/temp-notification")
@Tag(name = "Temporary Notification API")
class TempNotificationController(
    private val tempNotificationService: TempNotificationService,
    @Value(Config.NOTIFICATION_TEMP_ENABLED)
    private val tempNotificationsEnabled: Boolean = false
) {
    @GetMapping
    fun getAll() = if (tempNotificationsEnabled) { tempNotificationService.getAll() } else { throw NotFoundException() }

    @GetMapping("/{id}")
    fun getAll(@PathVariable("id") id: String) = if (tempNotificationsEnabled) {
        tempNotificationService.getAll().find { it.id == id }?.bodyHTML ?: throw NotFoundException()
    } else { throw NotFoundException() }
}
