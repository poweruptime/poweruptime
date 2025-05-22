package org.poweruptime.backend.features.notification.service

import org.poweruptime.backend.core.service.ASoftDeleteEntityService
import org.poweruptime.backend.features.notification.domain.NotificationMethodDataRepository
import org.poweruptime.backend.features.notification.model.NotificationMethodData
import org.springframework.stereotype.Service

@Service
class NotificationMethodDataService(
    notificationMethodDataRepository: NotificationMethodDataRepository,
) : ASoftDeleteEntityService<NotificationMethodData>(notificationMethodDataRepository)
