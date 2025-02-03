package org.poweruptime.backend.features.team.domain

import org.poweruptime.backend.features.team.model.TeamJoinToken
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface TeamJoinTokenRepository : JpaRepository<TeamJoinToken, String> {

    @Query(
        """
        select count(urt) from TeamJoinToken urt where urt.team.id = :teamId and urt.invitee.id = :inviteeId
        """,
    )
    fun countByTeamIdAndInviteeId(
        @Param("teamId") teamId: String,
        @Param("inviteeId") inviteeId: String
    ): Long

    @Query("""select urt from TeamJoinToken urt where urt.createdAt < :before""")
    fun findOlderThan(@Param("before") before: Instant): List<TeamJoinToken>

    @Query(
        """
        select urt from TeamJoinToken urt
        where
            urt.invitee.id = :inviteeId and
            urt.token = :token and
            urt.createdAt > :createdAfter and
            urt.version = 0
        """,
    )
    fun findValidByInviteeIdTokenAndCreatedAfter(
        @Param("inviteeId") inviteeId: String,
        @Param("token") token: String,
        @Param("createdAfter") createdAfter: Instant
    ): TeamJoinToken?
}
