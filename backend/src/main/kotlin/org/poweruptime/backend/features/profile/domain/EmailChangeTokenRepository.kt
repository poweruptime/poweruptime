package org.poweruptime.backend.features.profile.domain

import org.poweruptime.backend.features.profile.model.EmailChangeToken
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface EmailChangeTokenRepository : JpaRepository<EmailChangeToken, String> {

    @Query("""select ect from EmailChangeToken ect where ect.createdAt < :before""")
    fun findOlderThan(@Param("before") before: Instant): List<EmailChangeToken>

    @Query(
        """
        select ect
            from EmailChangeToken ect
        where ect.user.id = :userId and ect.createdAt > :createdAfter""",
    )
    fun findByUserIdAndCreatedAfter(
        @Param("userId") userId: String,
        @Param("createdAfter") createdAfter: Instant
    ): List<EmailChangeToken>

    @Query(
        """
        select count(ect) from EmailChangeToken ect
        where
            ect.createdAt > :createdAfter and
            ect.version != 0
        """,
    )
    fun countInvalidAndCreatedAfter(
        @Param("createdAfter") createdAfter: Instant
    ): Int

    @Query(
        """
        select ect from EmailChangeToken ect
        where
            ect.id = :token and
            ect.createdAt > :createdAfter and
            ect.version = 0
        """,
    )
    fun findValidByTokenAndCreatedAfter(
        @Param("token") token: String,
        @Param("createdAfter") createdAfter: Instant
    ): EmailChangeToken?

    @Query(
        """
        select ect from EmailChangeToken ect
        where
            ect.id = :token and
            ect.createdAt > :createdAfter
        """,
    )
    fun findByTokenAndCreatedAfter(
        @Param("token") token: String,
        @Param("createdAfter") createdAfter: Instant
    ): EmailChangeToken?
}
