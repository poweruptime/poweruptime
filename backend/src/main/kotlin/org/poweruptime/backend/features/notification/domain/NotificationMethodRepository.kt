package org.poweruptime.backend.features.notification.domain

import org.poweruptime.backend.core.domain.ISoftDeleteRepository
import org.poweruptime.backend.features.notification.model.NotificationMethod
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface NotificationMethodRepository :
    ISoftDeleteRepository<NotificationMethod>,
    JpaSpecificationExecutor<NotificationMethod> {
    @Query("""select nm from NotificationMethod nm join nm.usedByMonitors ubm where ubm.id = :monitorId""")
    fun findByMonitorId(@Param("monitorId") monitorId: String): List<NotificationMethod>
}
