package org.poweruptime.backend.features.notification.domain

import org.poweruptime.backend.core.domain.ISoftDeleteRepository
import org.poweruptime.backend.features.notification.core.NotificationSenderData
import org.springframework.stereotype.Repository

@Repository
interface NotificationSenderDataRepository : ISoftDeleteRepository<NotificationSenderData>
