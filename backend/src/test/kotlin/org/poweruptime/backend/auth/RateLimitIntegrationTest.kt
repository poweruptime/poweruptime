package org.poweruptime.backend.auth

import org.junit.jupiter.api.Test
import org.poweruptime.backend.configuration.toJSON
import org.poweruptime.backend.core.BaseTestWithReusingContainers
import org.poweruptime.backend.core.utils.Config
import org.poweruptime.backend.features.authentication.LoginDto
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.post

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = [
        "poweruptime.rate-limit.enabled=true",
    ],
)
class RateLimitEnabledIntegrationTest(
    @Autowired private val mvc: MockMvc,
    @Value(Config.RATE_LIMIT_TRIES) val rateLimitTries: Long,
) : BaseTestWithReusingContainers() {
    @Test
    fun `check if rate limit is enabled`() {
        repeat(rateLimitTries.toInt() + 20) {
            mvc.post("/v1/auth/login") {
                content = LoginDto(
                    email = "admin@admin.org",
                    password = "admin",
                ).toJSON()
                contentType = MediaType.APPLICATION_JSON
            }
        }

        mvc.post("/v1/auth/login") {
            content = LoginDto(
                email = "admin@admin.org",
                password = "admin",
            ).toJSON()
            contentType = MediaType.APPLICATION_JSON
        }.andExpect {
            status { isTooManyRequests() }
        }
    }
}

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = [
        "poweruptime.rate-limit.enabled=false",
    ],
)
class RateLimitDisabledIntegrationTest(
    @Autowired private val mvc: MockMvc,
    @Value(Config.RATE_LIMIT_TRIES) val rateLimitTries: Long,
) : BaseTestWithReusingContainers() {
    @Test
    fun `check if rate limit is disabled`() {
        repeat((rateLimitTries + 2).toInt()) {
            mvc.post("/v1/auth/login") {
                content = LoginDto(
                    email = "admin@admin.org",
                    password = "admin",
                ).toJSON()
                contentType = MediaType.APPLICATION_JSON
            }.andExpect {
                status { isOk() }
            }
        }
    }
}
