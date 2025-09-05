package org.poweruptime.backend.auth

import dev.turingcomplete.kotlinonetimepassword.GoogleAuthenticator
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.poweruptime.backend.configuration.toJSON
import org.poweruptime.backend.core.BaseTestWithReusingContainers
import org.poweruptime.backend.core.MockUser
import org.poweruptime.backend.core.MockUsers
import org.poweruptime.backend.core.resource.CustomHttpHeader
import org.poweruptime.backend.core.toDto
import org.poweruptime.backend.features.authentication.JwtResponse
import org.poweruptime.backend.features.authentication.LoginDto
import org.poweruptime.backend.features.profile.dto.ConfirmMFADto
import org.poweruptime.backend.features.profile.dto.SetupMFAResponse
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post

class MFAIntegrationTest(
    @Autowired private val mockMvc: MockMvc,
) : BaseTestWithReusingContainers() {
    @Nested
    @DisplayName("API Get /v1/profile/mfa")
    inner class SetupMFA {
        @Test
        fun `test if secured`() {
            mockMvc.get("/v1/profile/mfa").andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser(MockUsers.USER2)
        fun `test if success not existing`() {
            mockMvc.get("/v1/profile/mfa").andExpect {
                status { isOk() }
                content {
                    jsonPath("$.base32Secret") { exists() }
                }
            }
        }

        @Test
        @MockUser(MockUsers.USER3)
        fun `test if success existing but inactive`() {
            mockMvc.get("/v1/profile/mfa").andExpect {
                status { isOk() }
                content {
                    jsonPath("$.base32Secret") { exists() }
                }
            }
        }

        @Test
        @MockUser(MockUsers.USER4)
        fun `test if fails when already confirmed`() {
            mockMvc.get("/v1/profile/mfa").andExpect {
                status { isBadRequest() }
            }
        }
    }

    @Nested
    @DisplayName("API Post /v1/profile/mfa")
    inner class ConfirmMFA {
        @Test
        fun `test if secured`() {
            mockMvc.post("/v1/profile/mfa").andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser(MockUsers.USER3)
        fun `test if fails if not setup`() {
            mockMvc.post("/v1/profile/mfa").andExpect {
                status { isBadRequest() }
            }
        }

        @Test
        @MockUser(MockUsers.USER4)
        fun `test if fails if already confirmed`() {
            mockMvc.post("/v1/profile/mfa") {
                content = ConfirmMFADto(
                    code = "123456",
                ).toJSON()
                contentType = MediaType.APPLICATION_JSON
            }.andExpect {
                status { isBadRequest() }
            }
        }

        @Test
        @MockUser(MockUsers.USER3)
        fun `test if fails if wrong code`() {
            mockMvc.post("/v1/profile/mfa") {
                content = ConfirmMFADto(
                    code = "123456",
                ).toJSON()
                contentType = MediaType.APPLICATION_JSON
            }.andExpect {
                status { isBadRequest() }
            }
        }
    }

    @Test
    @MockUser(MockUsers.USER3)
    fun `test if success setup, confirm, delete and setup again`() {
        val response = mockMvc.get("/v1/profile/mfa") {
            contentType = MediaType.APPLICATION_JSON
        }.andExpect {
            status { isOk() }
            content {
                jsonPath("$.base32Secret") { exists() }
            }
        }.andReturn().toDto<SetupMFAResponse>()

        // Make explicit a login attempt, so we definitely have the new mfa in the user auth object
        val jwtResponse = mockMvc.post("/v1/auth/login") {
            content = LoginDto(
                email = "test3@test.org",
                password = "test1234",
                sessionInformation = null,
                stayLoggedIn = false,
            ).toJSON()
            contentType = MediaType.APPLICATION_JSON
        }.andReturn().toDto<JwtResponse>()

        mockMvc.post("/v1/profile/mfa") {
            headers {
                setBearerAuth(jwtResponse.accessToken)
            }
            content = ConfirmMFADto(
                code = GoogleAuthenticator(
                    base32secret = response.base32Secret.toByteArray(),
                ).generate(),
            ).toJSON()
            contentType = MediaType.APPLICATION_JSON
        }.andExpect {
            status { isOk() }
            content {
                jsonPath("$.backupCodes") { exists() }
                jsonPath("$.backupCodes.length()") { value(10) }
                jsonPath("$.backupCodes[0]") { exists() }
            }
        }

        mockMvc.delete("/v1/profile/mfa") {
            contentType = MediaType.APPLICATION_JSON
            headers {
                setBearerAuth(jwtResponse.accessToken)
                set(
                    CustomHttpHeader.MFA_CODE,
                    GoogleAuthenticator(
                        base32secret = response.base32Secret.toByteArray(),
                    ).generate(),
                )
            }
        }.andExpect {
            status { isOk() }
        }

        val response2 = mockMvc.get("/v1/profile/mfa") {
            contentType = MediaType.APPLICATION_JSON
        }.andExpect {
            status { isOk() }
            content {
                jsonPath("$.base32Secret") { exists() }
            }
        }.andReturn().toDto<SetupMFAResponse>()

        assertThat(response.base32Secret).isNotEqualTo(response2.base32Secret)
    }
}
