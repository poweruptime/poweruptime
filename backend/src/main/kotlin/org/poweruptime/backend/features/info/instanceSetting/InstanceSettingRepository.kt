package org.poweruptime.backend.features.info.instanceSetting

import org.poweruptime.backend.features.team.model.SettingKey
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface InstanceSettingRepository : JpaRepository<InstanceSetting, String> {
    @Query("select iSettting from InstanceSetting iSettting where iSettting.key = :key")
    fun findValueByKey(
        @Param("key") key: SettingKey,
    ): InstanceSetting?
}
