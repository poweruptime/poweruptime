package org.poweruptime.backend.features.team.domain

import org.poweruptime.backend.core.domain.ISoftDeleteRepository
import org.poweruptime.backend.features.team.model.Team
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface TeamRepository : ISoftDeleteRepository<Team>, JpaSpecificationExecutor<Team> {
    @Query(
        "select o from Team o where o.deleted is null",
    )
    fun findAll(
        @Param("query") query: String,
        pageable: Pageable
    ): Page<Team>

    @Query(
        "select o from TeamUser ou join ou.id.team o where ou.id.user.id=:id and o.deleted is null",
    )
    fun findTeamsByUserId(@Param("id") userId: String): List<Team>
}
