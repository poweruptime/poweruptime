package org.poweruptime.backend.core

import com.fasterxml.jackson.module.kotlin.readValue
import org.poweruptime.backend.configuration.puObjectMapper
import org.poweruptime.backend.configuration.toJSON
import org.poweruptime.backend.features.authentication.JwtResponse
import org.poweruptime.backend.features.authentication.LoginDto
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.stereotype.Component
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.post

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

        return puObjectMapper.readValue(response.response.contentAsByteArray)
    }
}
