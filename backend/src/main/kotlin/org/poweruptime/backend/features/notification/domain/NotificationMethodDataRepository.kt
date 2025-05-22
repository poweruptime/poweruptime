package org.poweruptime.backend.features.notification.domain

import org.poweruptime.backend.core.domain.ISoftDeleteRepository
import org.poweruptime.backend.features.notification.model.NotificationMethodData
import org.springframework.stereotype.Repository

@Repository
interface NotificationMethodDataRepository : ISoftDeleteRepository<NotificationMethodData>
