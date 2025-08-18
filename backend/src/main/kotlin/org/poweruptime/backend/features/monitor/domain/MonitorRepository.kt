package org.poweruptime.backend.features.monitor.domain

import org.poweruptime.backend.core.domain.ISoftDeleteRepository
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.transaction.annotation.Transactional

interface MonitorRepository : ISoftDeleteRepository<Monitor>, JpaSpecificationExecutor<Monitor> {
    @Transactional(readOnly = true)
    @Query("select m from Monitor m join m.team t where m.deleted is null and t.deleted is null")
    fun findAllNoneDeleted(): MutableList<Monitor>

    @Query("select m.id from Monitor m join m.team t where m.deleted is null and m.team.id = :tId")
    fun findIdsByTeamId(@Param("tId") teamId: String): List<String>

    @Query(
        """
        select m.status, count(m)
        from Monitor m
        join m.team t
        join t.teamUsers tu
        where tu.id.user.id = :uId and m.deleted is null
        group by m.status
    """,
    )
    fun countMonitorsByUserGrouped(@Param("uId") userId: String): List<Pair<MonitorStatus, Long>>

    @Query(
        """
    select new  org.poweruptime.backend.features.monitor.domain.TeamStatusCount(m.team.id, m.status, count(m))
    from Monitor m
    where m.team.id in :teamIds and m.deleted is null
    group by m.team.id, m.status
""",
    )
    fun countMonitorsByTeamIdsGrouped(
        @Param("teamIds") teamIds: List<String>
    ): List<TeamStatusCount>

    @Modifying
    @Transactional
    @Query(
        """
        update Monitor m set m.status = :status where m.id = :id
        """,
    )
    fun updateStatus(@Param("id") monitorId: String, @Param("status") status: MonitorStatus): Int
}

data class TeamStatusCount(
    val teamId: String,
    val status: MonitorStatus,
    val count: Long
)
