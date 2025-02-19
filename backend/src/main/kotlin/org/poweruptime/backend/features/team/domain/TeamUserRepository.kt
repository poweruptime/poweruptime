package org.poweruptime.backend.features.team.domain

import org.poweruptime.backend.features.team.model.TeamUser
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface TeamUserRepository : JpaRepository<TeamUser, String>, JpaSpecificationExecutor<TeamUser> {
    @Query(
        """
        select ou from TeamUser ou join ou.id.team o
        where ou.id.team.id=:tId and ou.id.user.id = :uId
        """,
    )
    fun findByTeamAndUserId(
        @Param("tId") teamId: String,
        @Param("uId") userId: String
    ): TeamUser?

    @Query(
        """
        select ou.id.team.id from TeamUser ou join ou.id.team o
        where ou.id.user.id = :uId
        """,
    )
    fun findTeamIdsByUserId(@Param("uId") userId: String): List<String>
}
