package org.poweruptime.backend.features.authentication.domain

import org.poweruptime.backend.features.authentication.model.MFA
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface MFARepository : JpaRepository<MFA, String> {
    @Query(
        """
        select mfa from MFA mfa where mfa.user.id = :userId
    """,
    )
    fun findByUserId(@Param("userId") userId: String): MFA?
}
