package org.poweruptime.backend.features.team.model

import jakarta.persistence.Converter
import org.poweruptime.backend.core.models.ADatabaseEnumConvertable
import org.poweruptime.backend.core.models.ADatabaseEnumConverter

enum class TeamRole : ADatabaseEnumConvertable {
    ADMIN {
        override val code = "A"
    },
    MEMBER {
        override val code = "M"
    },
}

@Converter(autoApply = true)
class TeamRoleDatabaseConverter : ADatabaseEnumConverter<TeamRole>() {
    override fun getKeys(): Array<TeamRole> = TeamRole.entries.toTypedArray()
}
