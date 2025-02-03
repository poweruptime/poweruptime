package org.poweruptime.backend.auth

import org.junit.jupiter.api.Test
import org.poweruptime.backend.configuration.toJSON
import org.poweruptime.backend.core.BaseTestWithReusingContainers
import org.poweruptime.backend.core.MockAdmin
import org.poweruptime.backend.core.ModelFactory
import org.poweruptime.backend.features.authentication.JwtResponse
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post

class SessionIntegrationTests(
    @Autowired private val mvc: MockMvc,
) : BaseTestWithReusingContainers() {

    @Test
    fun `test success`() {
        // Make explicit a login attempt, so we definitely have a session stored
        val jwtResponse = mvc.post("/v1/auth/login") {
            content = ModelFactory.getAdminSignInDto().toJSON()
            contentType = MediaType.APPLICATION_JSON
        }.andReturn().toDto(JwtResponse::class.java)

        mvc.get("/v1/profile/sessions") {
            headers {
                setBearerAuth(jwtResponse.accessToken!!)
            }
        }.andExpect {
            status { isOk() }
            content {
                contentType(MediaType.APPLICATION_JSON)
                jsonPath("$.data") { isArray() }
                jsonPath("$.numberOfItems") { value(1) }
            }
        }
    }

    @Test
    fun `test fail without auth`() {
        mvc.get("/v1/user/sessions").andExpect {
            status { isUnauthorized() }
        }
    }

    @Test
    @MockAdmin
    fun `test delete fail not existing session`() {
        mvc.delete("/v1/user/sessions/1111111").andExpect {
            status { isNotFound() }
        }
    }
}
