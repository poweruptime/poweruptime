package org.poweruptime.backend.features.systemNotification

import org.poweruptime.backend.core.service.AEntityService
import org.poweruptime.backend.features.systemNotification.dto.CreateSystemNotificationDto
import org.poweruptime.backend.features.systemNotification.dto.UpdateSystemNotificationDto
import org.poweruptime.backend.features.systemNotification.dto.fromDto
import org.poweruptime.backend.features.systemNotification.dto.update
import org.poweruptime.backend.features.systemNotification.model.SystemNotification
import org.springframework.stereotype.Service

@Service
class SystemNotificationService(
    private val systemNotificationRepository: SystemNotificationRepository,
) : AEntityService<SystemNotification>(systemNotificationRepository) {

    fun getActive(): List<SystemNotification> = systemNotificationRepository.getActive()

    fun create(it: CreateSystemNotificationDto): SystemNotification = save(SystemNotification.fromDto(it))

    fun update(it: UpdateSystemNotificationDto): SystemNotification = save(getByIdOrThrow(it.id).update(it))
}
