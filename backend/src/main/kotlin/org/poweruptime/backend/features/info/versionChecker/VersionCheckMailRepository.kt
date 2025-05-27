package org.poweruptime.backend.features.info.versionChecker

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface VersionCheckMailRepository : JpaRepository<VersionCheckMail, String> {
    @Query("select puVersion from VersionCheckMail puVersion where puVersion.puVersion = :puVersion")
    fun findByVersion(@Param("puVersion") version: String): VersionCheckMail?
}
