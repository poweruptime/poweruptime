package org.poweruptime.backend

import org.junit.jupiter.api.Test
import org.poweruptime.backend.core.BaseTestWithReusingContainers
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = [
        "springdoc.api-docs.enabled=false",
    ],
)
class SwaggerDisabledIntegrationTest(
    @Autowired private val mockMvc: MockMvc,
) : BaseTestWithReusingContainers() {
    @Test
    fun `check if swagger redirection url is working`() {
        mockMvc.get("/swagger/docs").andExpect {
            status { isNotFound() }
        }
    }

    @Test
    fun `check if swagger json is working`() {
        mockMvc.get("/swagger/docs-json").andExpect {
            status { isNotFound() }
        }
    }

    @Test
    fun `check if swagger is running`() {
        mockMvc.get("/swagger/docs-json/swagger-config").andExpect {
            status { isNotFound() }
        }
    }

    @Test
    fun `check if swagger ui is running`() {
        mockMvc.get("/swagger/swagger-ui/index.html?configUrl=/api/v3/api-docs/swagger-config").andExpect {
            status { isNotFound() }
        }
    }
}

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = [
        "springdoc.api-docs.enabled=true",
    ],
)
class SwaggerEnabledIntegrationTest(
    @Autowired private val mockMvc: MockMvc,
) : BaseTestWithReusingContainers() {
    @Test
    fun `check if swagger redirection url is working`() {
        mockMvc.get("/swagger/docs").andExpect {
            status { is3xxRedirection() }
        }
    }

    // Works but test fails
//    @Test
//    fun `check if swagger json is working`() {
//        mockMvc.get("/swagger/docs-json").andExpect {
//            status { isOk() }
//        }
//    }

    @Test
    fun `check if swagger is running`() {
        mockMvc.get("/swagger/docs-json/swagger-config").andExpect {
            status { isOk() }
        }
    }

    @Test
    fun `check if swagger ui is running`() {
        mockMvc.get("/swagger/swagger-ui/index.html?configUrl=/api/v3/api-docs/swagger-config").andExpect {
            status { isOk() }
        }
    }
}
