package org.poweruptime.backend.features.authentication.domain

import org.poweruptime.backend.features.authentication.model.Session
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

interface SessionRepository : JpaRepository<Session, String>, JpaSpecificationExecutor<Session> {
    @Query(
        """
        select s from Session s join s.tokens st
        where st.token = :token
    """,
    )
    fun findByToken(@Param("token") token: String): List<Session>

    @Query(
        """
        select s from Session s
        where s.user.id = :eId
    """,
    )
    fun findByUserId(@Param("eId") entityId: String): List<Session>

    @Query(
        """
        select s from Session s
        where s.updatedAt <= :updatedDateTime
    """,
    )
    fun findByUpdatedDateTimeBefore(@Param("updatedDateTime") updatedDateTime: Instant): List<Session>

    @Query(
        """
        select count(s)>0 from Session s join s.tokens st
        where st.token = :token
    """,
    )
    fun existsByToken(@Param("token") token: String): Boolean

    @Query(
        """
        select count(s)>0 from Session s
        where s.id = :sId and s.user.id = :uId
    """,
    )
    fun existsBySessionAndUserId(@Param("sId") sessionId: String, @Param("uId") userId: String): Boolean

    @Modifying
    @Transactional
    @Query(
        """
        update Session s
        set s.valid = false
        where s.id = :sId
    """,
    )
    fun invalidateSession(@Param("sId") sessionId: String)

    @Modifying
    @Transactional
    @Query(
        """
        update Session s
        set s.valid = false
        where s.id in :sIds
    """,
    )
    fun invalidateSessions(@Param("sIds") sessionIds: List<String>)
}
