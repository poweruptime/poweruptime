package org.poweruptime.backend.features.monitor.domain

import org.poweruptime.backend.core.domain.Repository
import org.poweruptime.backend.features.monitor.model.CheckResult
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface CheckResultRepository : Repository<CheckResult>, JpaSpecificationExecutor<CheckResult> {
    @Query(
        """
        select cr from CheckResult cr
        where cr.monitor.id = :monitorId
        and cr.pickedUpAt is not null
        order by cr.createdAt desc
        limit :limit
    """,
    )
    fun findLastByMonitorId(@Param("monitorId") monitorId: String, @Param("limit") limit: Int): List<CheckResult>

    @Query(
        value = """
    select * from (
        select cr.*,
               row_number() over (partition by cr.monitor_id order by cr.created_at desc) as rn
        from check_result cr
        where cr.monitor_id in :monitorIds
        and cr.picked_up_at is not null
    ) ranked
    where ranked.rn <= :limit
    order by ranked.monitor_id, ranked.created_at desc
    """,
        nativeQuery = true,
    )
    fun findLastByMonitorIds(
        @Param("monitorIds") monitorIds: List<String>,
        @Param("limit") limit: Int
    ): List<CheckResult>

    @Query(
        """
    SELECT cr FROM CheckResult cr
    WHERE cr.pickedUpAt >= :start
      AND cr.pickedUpAt < :end
      AND cr.monitor.id = :monitorId
      order by cr.pickedUpAt asc
    """,
    )
    fun findByMonitorIdAndPickedUpBetween(
        @Param("monitorId") monitorId: String,
        @Param("start") start: Instant,
        @Param("end") end: Instant
    ): List<CheckResult>

    @Query("""select cr from CheckResult cr join cr.monitor m where cr.createdAt < :before and m.team.id = :teamId""")
    fun findByTeamIdAndOlderThan(@Param("teamId") teamId: String, @Param("before") before: Instant): List<CheckResult>
}
