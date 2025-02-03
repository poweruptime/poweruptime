package org.poweruptime.backend.features.authentication.domain

import org.poweruptime.backend.features.authentication.model.PasswordResetToken
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface PasswordResetTokenRepository : JpaRepository<PasswordResetToken, String> {

    @Query("""select urt from PasswordResetToken urt where urt.createdAt < :before""")
    fun findOlderThan(@Param("before") before: Instant): List<PasswordResetToken>

    @Query(
        """
        select count(urt)
            from PasswordResetToken urt
        where urt.user.id = :userId and urt.createdAt > :createdAfter""",
    )
    fun countByUserIdAndCreatedAfter(
        @Param("userId") userId: String,
        @Param("createdAfter") createdAfter: Instant
    ): Int

    @Query(
        """
        select urt from PasswordResetToken urt
        where
            urt.user.id = :userId and
            urt.id = :token and
            urt.createdAt > :createdAfter and
            urt.version = 1
        """,
    )
    fun findValidByUserIdTokenAndCreatedAfter(
        @Param("userId") userId: String,
        @Param("token") token: String,
        @Param("createdAfter") createdAfter: Instant
    ): PasswordResetToken?
}
