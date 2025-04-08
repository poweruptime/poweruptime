package org.poweruptime.backend.auth

import dev.turingcomplete.kotlinonetimepassword.GoogleAuthenticator
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.poweruptime.backend.configuration.toJSON
import org.poweruptime.backend.core.AuthTestUtils
import org.poweruptime.backend.core.BaseTestWithReusingContainers
import org.poweruptime.backend.core.ModelFactory
import org.poweruptime.backend.core.resource.CustomHttpHeader
import org.poweruptime.backend.core.toDto
import org.poweruptime.backend.core.utils.toBase32EncodedByteArray
import org.poweruptime.backend.features.authentication.JwtResponse
import org.poweruptime.backend.features.authentication.LoginDto
import org.poweruptime.backend.features.authentication.RefreshJwtWithSessionTokenDto
import org.poweruptime.backend.features.authentication.service.SessionService
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import java.util.Calendar
import java.util.Date

class AuthIntegrationTest(
    @Autowired private val authTestUtils: AuthTestUtils,
    @Autowired private val mvc: MockMvc,
    @Autowired private val sessionService: SessionService
) : BaseTestWithReusingContainers() {

    @DisplayName("API /v1/secure")
    @Nested
    inner class UnsecureApi {
        @Test
        fun `check if auth is in place`() {
            mvc.get("/v1/secure")
                .andExpect {
                    status { isUnauthorized() }
                }
        }

        @Test
        fun `check if bearer token verification works`() {
            /**
             * When
             * We try to access secured api
             *
             * Then
             * we expect a successful response
             */
            val jwtResponse = authTestUtils.adminJwtResponse

            mvc.get("/v1/secure") {
                headers {
                    setBearerAuth(jwtResponse.accessToken!!)
                }
            }.andExpect {
                status { isOk() }
            }
        }

        @Test
        fun `test unsuccessful with wrong bearer token`() {
            mvc.get("/v1/secure") {
                headers {
                    setBearerAuth("wrong token")
                }
            }.andExpect {
                status { isUnauthorized() }
            }
        }
    }

    @DisplayName("API /v1/auth/login")
    @Nested
    inner class LoginApi {
        @Test
        fun `test successful admin login without session`() {
            mvc.post("/v1/auth/login") {
                content = LoginDto(
                    email = "admin@admin.org",
                    password = "admin",
                ).toJSON()
                contentType = MediaType.APPLICATION_JSON
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                content {
                    jsonPath("$.accessToken") { exists() }
                    jsonPath("$.refreshToken") { doesNotExist() }
                }
            }
        }

        @Test
        fun `test successful admin login with session`() {
            mvc.post("/v1/auth/login") {
                contentType = MediaType.APPLICATION_JSON
                content = LoginDto(
                    email = "admin@admin.org",
                    password = "admin",
                    sessionInformation = "Testing",
                    stayLoggedIn = true,
                ).toJSON()
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                content {
                    jsonPath("$.accessToken") { exists() }
                    jsonPath("$.refreshToken") { exists() }
                }
            }
        }

        @Test
        fun `test unsuccessful login with wrong credentials`() {
            mvc.post("/v1/auth/login") {
                content = LoginDto(
                    email = "some@some.com",
                    password = "asdf",
                    sessionInformation = "Testing",
                    stayLoggedIn = true,
                ).toJSON()
                contentType = MediaType.APPLICATION_JSON
            }.andExpect {
                status { isUnauthorized() }
                content { contentType(MediaType.APPLICATION_JSON) }
                content {
                    jsonPath("$.accessToken") { doesNotExist() }
                    jsonPath("$.refreshToken") { doesNotExist() }
                }
            }
        }

        @Test
        fun `test sign in with wrong credentials with existing email`() {
            mvc.post("/v1/auth/login") {
                content = LoginDto(
                    email = "admin@admin.org",
                    password = "wurst",
                ).toJSON()
                contentType = MediaType.APPLICATION_JSON
            }.andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        fun `test login with 2 users check jwt not equal`() {
            val user1Result = mvc.post("/v1/auth/login") {
                content = LoginDto(
                    email = "admin@admin.org",
                    password = "admin",
                ).toJSON()
                contentType = MediaType.APPLICATION_JSON
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                content {
                    jsonPath("$.accessToken") { exists() }
                    jsonPath("$.refreshToken") { doesNotExist() }
                }
            }.andReturn().toDto<JwtResponse>()

            val user2Result = mvc.post("/v1/auth/login") {
                content = LoginDto(
                    email = "test1@test.org",
                    password = "test",
                ).toJSON()
                contentType = MediaType.APPLICATION_JSON
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                content {
                    jsonPath("$.accessToken") { exists() }
                    jsonPath("$.refreshToken") { doesNotExist() }
                }
            }.andReturn().toDto<JwtResponse>()
            assertThat(user1Result.accessToken).isNotEqualTo(user2Result.accessToken)
        }

        @Test
        fun `test sign in with missing MFA code`() {
            mvc.post("/v1/auth/login") {
                content = LoginDto(
                    email = "test4@test.org",
                    password = "test",
                ).toJSON()
                contentType = MediaType.APPLICATION_JSON
            }.andExpect {
                status { isForbidden() }
            }
        }

        @Test
        fun `test sign in with incorrect MFA code`() {
            mvc.post("/v1/auth/login") {
                content = LoginDto(
                    email = "test4@test.org",
                    password = "test",
                ).toJSON()
                contentType = MediaType.APPLICATION_JSON
                headers {
                    set(CustomHttpHeader.MFA_CODE, "12345")
                }
            }.andExpect {
                status { isForbidden() }
            }
        }

        fun getDateTwoDaysAgo(): Date {
            val calendar = Calendar.getInstance()
            calendar.add(Calendar.DAY_OF_YEAR, -2)
            return calendar.time
        }

        @Test
        fun `test sign in with outdated MFA code`() {
            mvc.post("/v1/auth/login") {
                content = LoginDto(
                    email = "test4@test.org",
                    password = "test",
                    stayLoggedIn = true,
                    sessionInformation = "Testing1234",
                ).toJSON()
                contentType = MediaType.APPLICATION_JSON
                headers {
                    set(
                        CustomHttpHeader.MFA_CODE,
                        GoogleAuthenticator(
                            base32secret = "7tyjXh9ckw".toBase32EncodedByteArray(),
                        ).generate(getDateTwoDaysAgo()),
                    )
                }
            }.andExpect {
                status { isForbidden() }
            }
        }

        @Test
        fun `test sign in with MFA code`() {
            mvc.post("/v1/auth/login") {
                content = LoginDto(
                    email = "test4@test.org",
                    password = "test",
                    stayLoggedIn = true,
                    sessionInformation = "Testing1234",
                ).toJSON()
                contentType = MediaType.APPLICATION_JSON
                headers {
                    set(
                        CustomHttpHeader.MFA_CODE,
                        GoogleAuthenticator(base32secret = "7tyjXh9ckw".toBase32EncodedByteArray()).generate(),
                    )
                }
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                content {
                    jsonPath("$.accessToken") { exists() }
                    jsonPath("$.refreshToken") { exists() }
                }
            }
        }

        @Test
        fun `test sign in with used MFA backup code`() {
            mvc.post("/v1/auth/login") {
                content = LoginDto(
                    email = "test4@test.org",
                    password = "test",
                ).toJSON()
                contentType = MediaType.APPLICATION_JSON
                headers {
                    set(CustomHttpHeader.MFA_CODE, "sA1XZuMTFWTX8kxaS8CEP2fZx")
                }
            }.andExpect {
                status { isForbidden() }
            }
        }

        @Test
        fun `test sign in with MFA backup code`() {
            mvc.post("/v1/auth/login") {
                content = LoginDto(
                    email = "test4@test.org",
                    password = "test",
                ).toJSON()
                contentType = MediaType.APPLICATION_JSON
                headers {
                    set(CustomHttpHeader.MFA_CODE, "MrZcfxDk6kbFKrrw7APWk4Zz3")
                }
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                content {
                    jsonPath("$.accessToken") { exists() }
                    jsonPath("$.refreshToken") { doesNotExist() }
                }
            }
        }

        @Test
        fun `test sign in with MFA backup code used twice`() {
            mvc.post("/v1/auth/login") {
                content = LoginDto(
                    email = "test4@test.org",
                    password = "test",
                ).toJSON()
                contentType = MediaType.APPLICATION_JSON
                headers {
                    set(CustomHttpHeader.MFA_CODE, "HU5ELSCkW4XXFE5cpekk2buRM")
                }
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                content {
                    jsonPath("$.accessToken") { exists() }
                    jsonPath("$.refreshToken") { doesNotExist() }
                }
            }

            mvc.post("/v1/auth/login") {
                content = LoginDto(
                    email = "test4@test.org",
                    password = "test",
                ).toJSON()
                contentType = MediaType.APPLICATION_JSON
                headers {
                    set(CustomHttpHeader.MFA_CODE, "HU5ELSCkW4XXFE5cpekk2buRM")
                }
            }.andExpect {
                status { isForbidden() }
            }
        }
    }

    @DisplayName("API /v1/auth/refresh")
    @Nested
    inner class RefreshApi {
        @Test
        fun `test refresh token`() {
            val jwtResponse = authTestUtils.newAdminJwtResponse()

            val jwtRefreshApi = mvc.post("/v1/auth/refresh") {
                contentType = MediaType.APPLICATION_JSON
                content = RefreshJwtWithSessionTokenDto(
                    jwtResponse.refreshToken!!,
                    "refresh successful",
                ).toJSON()
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                content {
                    jsonPath("$.accessToken") { exists() }
                    jsonPath("$.refreshToken") { exists() }
                }
            }.andReturn().toDto<JwtResponse>()

            assertThat(jwtRefreshApi.refreshToken).isNotEqualTo(jwtResponse.refreshToken)
            assertThat(jwtRefreshApi.accessToken).isNotEqualTo(jwtResponse.accessToken)
        }

        @Test
        fun `test refresh token not valid twice`() {
            val jwtResponse = authTestUtils.newAdminJwtResponse()

            val dto = RefreshJwtWithSessionTokenDto(
                jwtResponse.refreshToken!!,
                "refresh successful",
            ).toJSON()

            val jwtRefreshApi = mvc.post("/v1/auth/refresh") {
                contentType = MediaType.APPLICATION_JSON
                content = dto
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                content {
                    jsonPath("$.accessToken") { exists() }
                    jsonPath("$.refreshToken") { exists() }
                }
            }.andReturn().toDto<JwtResponse>()

            assertThat(jwtRefreshApi.refreshToken).isNotEqualTo(jwtResponse.refreshToken)
            assertThat(jwtRefreshApi.accessToken).isNotEqualTo(jwtResponse.accessToken)

            mvc.post("/v1/auth/refresh") {
                contentType = MediaType.APPLICATION_JSON
                content = dto
            }.andExpect {
                status { isUnauthorized() }
                content { contentType(MediaType.APPLICATION_JSON) }
            }
        }

        @Test
        fun `test refresh token with invalid session information`() {
            val jwtResponse = mvc.post("/v1/auth/login") {
                content = ModelFactory.getAdminSignInDto().toJSON()
                contentType = MediaType.APPLICATION_JSON
            }.andReturn().toDto<JwtResponse>()

            mvc.post("/v1/auth/refresh") {
                contentType = MediaType.APPLICATION_JSON
                content = RefreshJwtWithSessionTokenDto(
                    jwtResponse.refreshToken!!,
                    "short",
                ).toJSON()
            }.andExpect {
                status { isBadRequest() }
            }
        }

        @Test
        fun `test refresh token not valid`() {
            // Given
            val response = mvc.post("/v1/auth/login") {
                content = ModelFactory.getAdminSignInDto().toJSON()
                contentType = MediaType.APPLICATION_JSON
            }.andReturn().toDto<JwtResponse>()
            assertThat(response.accessToken).isNotNull
            assertThat(response.refreshToken).isNotNull

            // When
            val userSession = sessionService.getByTokenOrThrow(response.refreshToken!!)
            userSession.valid = false
            sessionService.save(userSession)

            // Then
            mvc.post("/v1/auth/refresh") {
                contentType = MediaType.APPLICATION_JSON
                content = RefreshJwtWithSessionTokenDto(
                    refreshToken = response.refreshToken!!,
                    sessionInformation = "poweruptime integration tests",
                ).toJSON()
            }.andExpect {
                status { isUnauthorized() }
                content { contentType(MediaType.APPLICATION_JSON) }
            }
        }
    }
}
