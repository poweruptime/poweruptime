package org.poweruptime.backend.features.authentication.model

import jakarta.persistence.Converter
import org.poweruptime.backend.core.models.ADatabaseEnumConvertable
import org.poweruptime.backend.core.models.ADatabaseEnumConverter
import org.springframework.security.core.authority.SimpleGrantedAuthority

enum class SystemRole : ADatabaseEnumConvertable {
    ADMIN {
        override val code = "A"
    },
    USER {
        override val code = "U"
    };

    val grantedAuthority = SimpleGrantedAuthority("ROLE_$name")
    val grantedAuthorities = listOf(grantedAuthority)
}

@Converter(autoApply = true)
class SystemRoleDatabaseConverter : ADatabaseEnumConverter<SystemRole>() {
    override fun getKeys(): Array<SystemRole> = SystemRole.entries.toTypedArray()
}
