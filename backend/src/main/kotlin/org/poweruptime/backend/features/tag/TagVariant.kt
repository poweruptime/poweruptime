package org.poweruptime.backend.features.tag

import org.poweruptime.backend.core.models.ADatabaseEnumConvertable

enum class TagVariant : ADatabaseEnumConvertable {
    RED {
        override val code = "R"
    },
    BLUE {
        override val code = "B"
    },
    GREEN {
        override val code = "G"
    },
    PINK {
        override val code = "P"
    },
    YELLOW {
        override val code = "Y"
    },
}
