package org.poweruptime.backend.features.notification.service

import org.poweruptime.backend.core.service.ASoftDeleteEntityService
import org.poweruptime.backend.features.notification.core.NotificationMethodData
import org.poweruptime.backend.features.notification.domain.NotificationMethodDataRepository
import org.springframework.stereotype.Service

@Service
class NotificationMethodDataService(
    notificationMethodDataRepository: NotificationMethodDataRepository,
) : ASoftDeleteEntityService<NotificationMethodData>(notificationMethodDataRepository)
