package org.poweruptime.backend.auth

import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.poweruptime.backend.configuration.toJSON
import org.poweruptime.backend.core.BaseTestWithReusingContainers
import org.poweruptime.backend.core.ClearDatabase
import org.poweruptime.backend.core.ClearInitDatabase
import org.poweruptime.backend.core.ModelFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post

class SetupIntegrationTest(@Autowired private val mvc: MockMvc) : BaseTestWithReusingContainers() {
    @DisplayName("API /v1/public/setup")
    @Nested
    inner class SetupApi {
        @Test
        @ClearInitDatabase
        fun `test fail already setup`() {
            mvc
                .post("/v1/public/setup") {
                    content = ModelFactory.getTestSetupDto().toJSON()
                    contentType = MediaType.APPLICATION_JSON
                }.andExpect {
                    status { isForbidden() }
                    content { contentType(MediaType.APPLICATION_JSON) }
                    content {
                        jsonPath("$.codeName") { value("SETUP_COMPLETED") }
                    }
                }

            mvc.get("/v1/public/info/is-setup").andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                content {
                    jsonPath("$.it") { value(false) }
                }
            }
        }

        @Test
        @ClearDatabase
        fun `test successful`() {
            mvc.get("/v1/public/info/is-setup").andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                content {
                    jsonPath("$.it") { value(true) }
                }
            }

            mvc
                .post("/v1/public/setup") {
                    contentType = MediaType.APPLICATION_JSON
                    content = ModelFactory.getTestSetupDto().toJSON()
                }.andExpect {
                    status { isOk() }
                    content { contentType(MediaType.APPLICATION_JSON) }
                    content {
                        jsonPath("$.id") { exists() }
                    }
                }

            mvc.get("/v1/public/info/is-setup").andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                content {
                    jsonPath("$.it") { value(false) }
                }
            }

            mvc
                .post("/v1/public/setup") {
                    content = ModelFactory.getTestSetupDto().toJSON()
                    contentType = MediaType.APPLICATION_JSON
                }.andExpect {
                    status { isForbidden() }
                    content { contentType(MediaType.APPLICATION_JSON) }
                    content {
                        jsonPath("$.codeName") { value("SETUP_COMPLETED") }
                    }
                }
        }
    }

    @DisplayName("API /v1/public/setup/email")
    @Nested
    inner class SetupEmailApi {
        @Test
        @ClearInitDatabase
        fun `test fail already setup`() {
            mvc.post("/v1/public/setup/email?email=admin@admin.org").andExpect {
                status { isForbidden() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.codeName") { value("SETUP_COMPLETED") }
                }
            }

            mvc.get("/v1/public/info/is-setup").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.it") { value(false) }
                }
            }
        }

        @Test
        @ClearDatabase
        fun `test successful`() {
            mvc.post("/v1/public/setup/email?email=admin@admin.org").andExpect {
                status { isOk() }
            }

            mvc.get("/v1/public/info/is-setup").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.it") { value(true) }
                }
            }
        }
    }

    @DisplayName("API /v1/public/setup/email/verify")
    @Nested
    inner class VerifyEmailApi {
        @Test
        @ClearInitDatabase
        fun `test fail already setup`() {
            mvc.get("/v1/public/setup/email/verify?code=123456").andExpect {
                status { isForbidden() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.codeName") { value("SETUP_COMPLETED") }
                }
            }
        }

        @Test
        @ClearDatabase
        fun `test fail invalid code`() {
            mvc.get("/v1/public/setup/email/verify?code=123456").andExpect {
                status { isBadRequest() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.codeName") { value("INVALID_CODE") }
                }
            }

            mvc.get("/v1/public/info/is-setup").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.it") { value(true) }
                }
            }
        }
    }
}
