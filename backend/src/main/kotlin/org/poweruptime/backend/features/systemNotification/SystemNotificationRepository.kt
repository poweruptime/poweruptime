package org.poweruptime.backend.features.systemNotification

import org.poweruptime.backend.core.domain.Repository
import org.poweruptime.backend.features.systemNotification.model.SystemNotification
import org.springframework.data.jpa.repository.Query

interface SystemNotificationRepository : Repository<SystemNotification> {

    @Query(
        """
        select n from SystemNotification n
        where n.active = true
    """,
    )
    fun getActive(): List<SystemNotification>
}
