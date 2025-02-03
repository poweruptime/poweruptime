package org.poweruptime.backend.features.monitor.domain

import org.poweruptime.backend.features.monitor.model.CheckResultLogEntry
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant

@Repository
interface CheckResultLogEntryRepository :
    org.poweruptime.backend.core.domain.Repository<CheckResultLogEntry>,
    JpaSpecificationExecutor<CheckResultLogEntry> {

    @Query(
        """
        select crlge from CheckResultLogEntry crlge
        join crlge.checkResult cr join cr.monitor m
        where crlge.createdAt < :before and m.team.id = :teamId
        """,
    )
    fun findByTeamIdAndOlderThan(
        @Param(
            "teamId",
        ) teamId: String,
        @Param("before") before: Instant
    ): List<CheckResultLogEntry>
}
