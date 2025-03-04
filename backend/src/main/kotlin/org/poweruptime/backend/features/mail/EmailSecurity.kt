package org.poweruptime.backend.features.mail

import jakarta.persistence.Converter
import org.poweruptime.backend.core.models.ADatabaseEnumConvertable
import org.poweruptime.backend.core.models.ADatabaseEnumConverter

const val EMAIL_SECURITY_NONE_STARTTLS = "S"
const val EMAIL_SECURITY_TLS = "T"

enum class EmailSecurity : ADatabaseEnumConvertable {
    NONE_STARTTLS {
        override val code = EMAIL_SECURITY_NONE_STARTTLS
    },
    TLS {
        override val code = EMAIL_SECURITY_TLS
    },
}

@Converter(autoApply = true)
class EmailSecurityDatabaseConverter : ADatabaseEnumConverter<EmailSecurity>() {
    override fun getKeys(): Array<EmailSecurity> = EmailSecurity.entries.toTypedArray()
}
