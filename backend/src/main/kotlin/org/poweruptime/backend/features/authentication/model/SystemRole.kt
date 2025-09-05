package org.poweruptime.backend.features.authentication.model

import org.poweruptime.backend.core.models.ADatabaseEnumConvertable
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

const val MAX_SYSTEM_ROLE_LENGTH = 5
val MAX_SYSTEM_ROLE_LENGTH_TEST = SystemRole.entries.maxOf { it.code.length }
