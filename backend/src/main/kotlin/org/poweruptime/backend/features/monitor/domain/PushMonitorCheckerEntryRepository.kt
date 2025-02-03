package org.poweruptime.backend.features.monitor.domain

import org.poweruptime.backend.core.domain.Repository
import org.poweruptime.backend.features.monitor.checker.push.PushMonitorCheckerEntry
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

@org.springframework.stereotype.Repository
interface PushMonitorCheckerEntryRepository : Repository<PushMonitorCheckerEntry>, IPushMonitorCheckerEntryRepository {
    @Query(
        """
        select pe from PushMonitorCheckerEntry pe where pe.pushId = :pushId and pe.createdAt >= :then order by pe.createdAt desc limit 1
    """,
    )
    override fun getLatestByPushIdAndBetweenNowAndThen(
        @Param("pushId") pushId: String,
        @Param("then") then: Instant
    ): PushMonitorCheckerEntry?
}

interface IPushMonitorCheckerEntryRepository {
    fun getLatestByPushIdAndBetweenNowAndThen(
        @Param("pushId") pushId: String,
        @Param("then") then: Instant
    ): PushMonitorCheckerEntry?
}
