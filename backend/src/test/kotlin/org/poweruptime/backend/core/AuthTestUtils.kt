package org.poweruptime.backend.core

import dev.turingcomplete.kotlinonetimepassword.GoogleAuthenticator
import org.poweruptime.backend.configuration.puJsonMapper
import org.poweruptime.backend.configuration.toJSON
import org.poweruptime.backend.core.resource.CustomHttpHeader
import org.poweruptime.backend.core.utils.toBase32EncodedByteArray
import org.poweruptime.backend.features.authentication.JwtResponse
import org.poweruptime.backend.features.authentication.LoginDto
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.stereotype.Component
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.post
import tools.jackson.module.kotlin.readValue
import java.util.Date

@Component
class AuthTestUtils(
    @Autowired val mvc: MockMvc
) {
    val adminJwtResponse: JwtResponse by lazy {
        loginUser(ModelFactory.getAdminSignInDto())
    }

    fun newAdminJwtResponse(): JwtResponse {
        return loginUser(ModelFactory.getAdminSignInDto())
    }

    private final fun loginUser(userLoginDto: LoginDto): JwtResponse {
        val response = mvc.post("/v1/auth/login") {
            content = userLoginDto.toJSON()
            contentType = MediaType.APPLICATION_JSON
        }.andExpect {
            status { isOk() }
            content { contentType(MediaType.APPLICATION_JSON) }
            content {
                jsonPath("$.accessToken") { exists() }
            }
        }.andReturn()

        return puJsonMapper.readValue(response.response.contentAsByteArray)
    }
}

fun getMFACode(secret: String, date: Date = Date()) = GoogleAuthenticator(
    base32secret = secret.toBase32EncodedByteArray(),
).generate(date)

fun HttpHeaders.setMFACode(secret: String, date: Date = Date()) = this.set(
    CustomHttpHeader.MFA_CODE,
    getMFACode(secret, date),
)
