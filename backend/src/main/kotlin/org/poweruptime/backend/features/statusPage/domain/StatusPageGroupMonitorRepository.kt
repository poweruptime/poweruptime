package org.poweruptime.backend.features.statusPage.domain

import org.poweruptime.backend.features.statusPage.model.StatusPageGroupMonitor
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface StatusPageGroupMonitorRepository :
    JpaRepository<StatusPageGroupMonitor, String>,
    JpaSpecificationExecutor<StatusPageGroupMonitor> {
    @Query(
        """
        select spgm from StatusPageGroupMonitor spgm where spgm.statusPage.id = :statusPageId order by spgm.position asc
        """,
    )
    fun findByStatusPage(@Param("statusPageId") statusPageId: String): List<StatusPageGroupMonitor>
}
