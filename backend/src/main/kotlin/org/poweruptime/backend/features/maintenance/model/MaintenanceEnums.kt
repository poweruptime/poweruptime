package org.poweruptime.backend.features.maintenance.model

import org.poweruptime.backend.core.models.ADatabaseEnumConvertable

enum class MaintenanceVisibility : ADatabaseEnumConvertable {
    INTERNAL {
        override val code = "I"
    },
    PUBLIC {
        override val code = "P"
    },
}

enum class MaintenanceAlertBehavior : ADatabaseEnumConvertable {
    SUPPRESS {
        override val code = "S"
    },
    DOWNGRADE {
        override val code = "D"
    },
    ALLOW {
        override val code = "A"
    },
}
