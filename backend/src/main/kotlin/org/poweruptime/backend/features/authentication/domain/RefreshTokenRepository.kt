package org.poweruptime.backend.features.authentication.domain

import org.poweruptime.backend.features.authentication.model.RefreshToken
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.transaction.annotation.Transactional

interface RefreshTokenRepository : JpaRepository<RefreshToken, String> {
    @Query(
        """
        select st from RefreshToken st
        where st.token = ?1
    """,
    )
    fun findByToken(token: String): RefreshToken?

    @Modifying
    @Transactional
    @Query(
        """
        update RefreshToken rT
        set rT.valid = false
        where rT.session.id = :session_id
    """,
    )
    fun invalidateAllTokensForSession(@Param("session_id") sessionId: String)

    @Modifying
    @Transactional
    @Query(
        """
        update RefreshToken rT
        set rT.valid = false
        where rT.session.id in :session_ids
    """,
    )
    fun invalidateAllTokensForSessions(@Param("session_ids") sessionIds: List<String>)
}
