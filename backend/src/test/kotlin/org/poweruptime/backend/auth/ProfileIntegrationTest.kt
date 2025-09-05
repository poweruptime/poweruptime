package org.poweruptime.backend.auth

import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.poweruptime.backend.configuration.toJSON
import org.poweruptime.backend.core.BaseTestWithReusingContainers
import org.poweruptime.backend.core.MockAdmin
import org.poweruptime.backend.core.MockUser
import org.poweruptime.backend.core.MockUsers
import org.poweruptime.backend.core.setMFACode
import org.poweruptime.backend.features.profile.dto.UpdatePasswordDto
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.put

class ProfileIntegrationTest(
    @Autowired private val mockMvc: MockMvc,
) : BaseTestWithReusingContainers() {
    @Nested
    @DisplayName("API Get /v1/profile")
    inner class GetProfile {
        @Test
        fun `test if secured`() {
            mockMvc.get("/v1/profile").andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockAdmin
        fun `test if accessible with admin user`() {
            mockMvc.get("/v1/profile").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.email") { value("admin@admin.org") }
                    jsonPath("$.name") { value("Gerhold Walburga") }
                    jsonPath("$.role") { value("ADMIN") }
                }
            }
        }

        @Test
        @MockUser
        fun `test if success`() {
            mockMvc.get("/v1/profile").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.email") { value("test1@test.org") }
                    jsonPath("$.name") { value("Maria Bauer") }
                    jsonPath("$.role") { value("USER") }
                }
            }
        }

        @Test
        @MockUser(MockUsers.USER3)
        fun `test if success with inactive mfa`() {
            mockMvc.get("/v1/profile/mfa/state").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    string(""""DISABLED"""")
                }
            }
        }

        @Test
        @MockUser(MockUsers.USER4)
        fun `test if success with enabled mfa`() {
            mockMvc.get("/v1/profile/mfa/state").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    string(""""ENABLED"""")
                }
            }
        }
    }

    @Nested
    @DisplayName("API Put /v1/profile/password")
    inner class UpdatePassword {
        @Test
        fun `test if secured`() {
            mockMvc.put("/v1/profile/password").andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser
        fun `test if fails with wrong password`() {
            mockMvc.put("/v1/profile/password") {
                content = UpdatePasswordDto(
                    oldPassword = "testWrong",
                    newPassword = "testNew",
                ).toJSON()
                contentType = MediaType.APPLICATION_JSON
            }.andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockUser(MockUsers.USER4)
        fun `test if fails with with enabled MFA`() {
            mockMvc.put("/v1/profile/password") {
                content = UpdatePasswordDto(
                    oldPassword = "test1234",
                    newPassword = "test1234",
                ).toJSON()
                contentType = MediaType.APPLICATION_JSON
            }.andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockUser
        fun `test if success`() {
            mockMvc.put("/v1/profile/password") {
                content = UpdatePasswordDto(
                    oldPassword = "test1234",
                    newPassword = "test1234",
                ).toJSON()
                contentType = MediaType.APPLICATION_JSON
            }.andExpect {
                status { isOk() }
            }
        }

        @Test
        @MockUser(MockUsers.USER4)
        fun `test if success with enabled MFA`() {
            mockMvc.put("/v1/profile/password") {
                content = UpdatePasswordDto(
                    oldPassword = "test1234",
                    newPassword = "test1234",
                ).toJSON()
                contentType = MediaType.APPLICATION_JSON
                headers {
                    setMFACode("7tyjXh9ckw")
                }
            }.andExpect {
                status { isOk() }
            }
        }
    }

    @Nested
    @DisplayName("API Get /v1/profile/sessions")
    inner class GetSessions {
        @Test
        fun `test if secured`() {
            mockMvc.get("/v1/profile/sessions").andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser
        fun `test if success`() {
            mockMvc.get("/v1/profile/sessions").andExpect {
                status { isOk() }
                content {
                    jsonPath("$.numberOfItems") { exists() }
                    jsonPath("$.numberOfPages") { exists() }
                    jsonPath("$.data") { exists() }
                }
            }
        }
    }
}
