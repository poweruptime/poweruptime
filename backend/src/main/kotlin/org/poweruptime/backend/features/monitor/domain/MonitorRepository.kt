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

    @Query(
        """
        select count(m) from Monitor m
        join m.team t
        join t.teamUsers tu
        where tu.id.user.id = :uId and m.deleted is null
    """,
    )
    fun countMonitorsByUserEmail(@Param("uId") userId: String): Long

    @Query("select count(m) from Monitor m where m.team.id = :teamId and m.deleted is null")
    fun countMonitorsByTeamId(@Param("teamId") teamId: String): Long

    @Query(
        """
        select count(m) from Monitor m
        join m.team t
        join t.teamUsers tu
        where tu.id.user.id = :uId and m.status = :status and m.deleted is null
    """,
    )
    fun countMonitorsByUserEmailAndStatus(
        @Param("uId") userId: String,
        @Param("status") status: MonitorStatus
    ): Long

    @Query("select count(m) from Monitor m where m.team.id = :teamId and m.status = :status and m.deleted is null")
    fun countMonitorsByTeamIdAndStatus(
        @Param("teamId") teamId: String,
        @Param("status") status: MonitorStatus
    ): Long

    @Modifying
    @Transactional
    @Query(
        """
        update Monitor m set m.status = :status where m.id = :id
        """,
    )
    fun updateStatus(@Param("id") monitorId: String, @Param("status") status: MonitorStatus): Int
}
