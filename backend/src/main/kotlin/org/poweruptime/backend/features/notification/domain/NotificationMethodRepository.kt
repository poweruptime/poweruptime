package org.poweruptime.backend.features.notification.domain

import org.poweruptime.backend.core.domain.ISoftDeleteRepository
import org.poweruptime.backend.features.notification.model.NotificationMethod
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.stereotype.Repository

@Repository
interface NotificationMethodRepository :
    ISoftDeleteRepository<NotificationMethod>,
    JpaSpecificationExecutor<NotificationMethod>
