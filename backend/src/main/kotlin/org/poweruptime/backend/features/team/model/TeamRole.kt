package org.poweruptime.backend.features.team.model

import org.poweruptime.backend.core.models.ADatabaseEnumConvertable

enum class TeamRole : ADatabaseEnumConvertable {
    ADMIN {
        override val code = "A"
    },
    MEMBER {
        override val code = "M"
    },
}
