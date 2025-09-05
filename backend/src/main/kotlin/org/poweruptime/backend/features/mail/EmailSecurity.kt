package org.poweruptime.backend.features.mail

import org.poweruptime.backend.core.models.ADatabaseEnumConvertable

enum class EmailSecurity : ADatabaseEnumConvertable {
    NONE_STARTTLS {
        override val code = "S"
    },
    TLS {
        override val code = "T"
    },
}
