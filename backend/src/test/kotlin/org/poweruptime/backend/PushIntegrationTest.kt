package org.poweruptime.backend

import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.poweruptime.backend.core.BaseTestWithReusingContainers
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get

class PushIntegrationTest(
    @Autowired private val mvc: MockMvc,
) : BaseTestWithReusingContainers() {

    @DisplayName("API /v1/see")
    @Nested
    inner class SSETest {
        @Test
        fun `check if auth is in place`() {
            mvc.get("/v1/see").andExpect {
                status { isUnauthorized() }
            }
        }
    }
}
