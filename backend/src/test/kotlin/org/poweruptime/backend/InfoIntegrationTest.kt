package org.poweruptime.backend

import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.poweruptime.backend.core.BaseTestWithReusingContainers
import org.poweruptime.backend.core.MockAdmin
import org.poweruptime.backend.core.MockUser
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get

class InfoIntegrationTest(
    @Autowired private val mvc: MockMvc,
) : BaseTestWithReusingContainers() {

    @DisplayName("API /v1/public/info")
    @Nested
    inner class PublicInfoApi {
        @Test
        fun `test host`() {
            mvc.get("/v1/public/info/host").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.it") { value("localhost:4200") }
                }
            }
        }

        @Test
        fun `test version`() {
            mvc.get("/v1/public/info/version").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.it") { value("99.99.99") }
                }
            }
        }

        @Test
        fun `test oauth2 providers`() {
            mvc.get("/v1/public/info/version").andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
            }
        }

        @Test
        fun `test support`() {
            mvc.get("/v1/public/info/support").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.showSupportBadge") { exists() }
                }
            }
        }
    }

    @DisplayName("API /v1/info")
    @Nested
    inner class InfoApi {
        @Test
        fun `test if time secured`() {
            mvc.get("/v1/info/time").andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        fun `test if environment secured`() {
            mvc.get("/v1/info/environment").andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser
        fun `test time success`() {
            mvc.get("/v1/info/time").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.serverTime") { exists() }
                    jsonPath("$.serverStartTime") { exists() }
                    jsonPath("$.serverSetupTime") { exists() }
                }
            }
        }

        @Test
        @MockUser
        fun `test environment role`() {
            mvc.get("/v1/info/environment").andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        fun `test environment success`() {
            mvc.get("/v1/info/environment").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.javaRuntimeVersion") { exists() }
                    jsonPath("$.osName") { exists() }
                    jsonPath("$.host") { exists() }
                    jsonPath("$.port") { exists() }
                    jsonPath("$.swaggerEnabled") { exists() }
                    jsonPath("$.mailEnabled") { exists() }
                    jsonPath("$.pushEnabled") { exists() }
                }
            }
        }
    }
}
