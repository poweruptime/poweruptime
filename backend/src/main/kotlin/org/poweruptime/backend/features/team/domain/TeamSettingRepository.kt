package org.poweruptime.backend.features.team.domain

import org.poweruptime.backend.features.team.model.SettingKey
import org.poweruptime.backend.features.team.model.TeamSetting
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface TeamSettingRepository : JpaRepository<TeamSetting, String> {
    @Query("select ts from TeamSetting ts where ts.key = :key and ts.team.id = :tId")
    fun findValueByKeyAndTeamId(
        @Param("key") key: SettingKey,
        @Param("tId") teamId: String
    ): TeamSetting?
}
