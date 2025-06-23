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
      SELECT *
      FROM (
        SELECT
          cr.*,
          ROW_NUMBER() OVER (
            PARTITION BY cr.monitor_id
            ORDER BY cr.created_at DESC
          ) AS rn
        FROM check_result cr
        WHERE
          cr.monitor_id  IN (:monitorIds)
          AND cr.picked_up_at IS NOT NULL
      ) sub
      WHERE sub.rn <= :limit
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
