package org.poweruptime.backend.features.authentication.domain

import org.poweruptime.backend.features.authentication.model.MFABackupCode
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.transaction.annotation.Transactional

interface MFABackupCodeRepository : JpaRepository<MFABackupCode, String> {
    @Query(
        """
        select mfabc from MFABackupCode mfabc where mfabc.mfa.id = :mfaId
    """,
    )
    fun findByMFAId(@Param("mfaId") mfaId: String): List<MFABackupCode>

    @Modifying
    @Transactional
    @Query(
        """
        update MFABackupCode mfabc set mfabc.valid = false where mfabc.id = :id
    """,
    )
    fun invalidateCode(@Param("id") id: String)
}
