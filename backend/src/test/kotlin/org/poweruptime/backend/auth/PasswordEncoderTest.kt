package org.poweruptime.backend.auth

import org.junit.jupiter.api.Test
import org.poweruptime.backend.core.BaseTestWithReusingContainers
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.crypto.password.PasswordEncoder

class PasswordEncoderTest(
    @Autowired private val passwordEncoder: PasswordEncoder
) : BaseTestWithReusingContainers() {
    @Test
    fun `test password encoder`() {
        println("Password: ${passwordEncoder.encode("test")}")
    }
}
