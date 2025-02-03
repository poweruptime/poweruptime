package org.poweruptime.backend.features.notification.service

import org.poweruptime.backend.core.service.ASoftDeleteEntityService
import org.poweruptime.backend.features.notification.core.NotificationSenderData
import org.poweruptime.backend.features.notification.domain.NotificationSenderDataRepository
import org.springframework.stereotype.Service

@Service
class NotificationSenderDataService(
    notificationSenderDataRepository: NotificationSenderDataRepository,
) : ASoftDeleteEntityService<NotificationSenderData>(notificationSenderDataRepository)
