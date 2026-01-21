package org.poweruptime.backend.notification

import org.junit.jupiter.api.Test
import org.poweruptime.backend.core.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.*

class NotificationIntegrationTests(@Autowired val mockMvc: MockMvc) : BaseTestWithReusingContainers() {
    @Test
    fun `test if secured`() {
        mockMvc.get("/v1/notification").andExpect {
            status { isUnauthorized() }
        }
    }

    @Test
    @MockUser(MockUsers.USER3)
    fun `test if secured by permissions teamId`() {
        mockMvc.get("/v1/notification?teamId=4Lxhu5YKWPBr&page=0&size=10").andExpect {
            status { isForbidden() }
        }
    }

    @Test
    @MockUser(MockUsers.USER3)
    fun `test if secured by permissions monitorId`() {
        mockMvc.get("/v1/notification?monitorId=k6A6bEK7C9pC&page=0&size=10").andExpect {
            status { isForbidden() }
        }
    }

    @Test
    @MockUser
    @ClearInitDatabase
    fun `test if accessible with user`() {
        mockMvc.get("/v1/notification?page=0&size=10").andExpect {
            status { isOk() }
            content {
                contentType(MediaType.APPLICATION_JSON)
                jsonPath("$.data.length()") { value(10) }
            }
        }
    }

    @Test
    @MockAdmin
    @ClearInitDatabase
    fun `test if accessible with admin user`() {
        mockMvc.get("/v1/notification?teamId=4Lxhu5YKWPBr&page=0&size=10").andExpect {
            status { isOk() }
            content {
                contentType(MediaType.APPLICATION_JSON)
                jsonPath("$.data.length()") { value(10) }
            }
        }
    }

    @Test
    @MockUser
    @ClearInitDatabase
    fun `test if accessible with team admin`() {
        mockMvc.get("/v1/notification?teamId=4Lxhu5YKWPBr&page=0&size=10").andExpect {
            status { isOk() }
            content {
                contentType(MediaType.APPLICATION_JSON)
                jsonPath("$.data.length()") { value(10) }
            }
        }
    }

    @Test
    @MockUser(MockUsers.USER2)
    @ClearInitDatabase
    fun `test if accessible with team user`() {
        mockMvc.get("/v1/notification?teamId=4Lxhu5YKWPBr&page=0&size=10").andExpect {
            status { isOk() }
            content {
                contentType(MediaType.APPLICATION_JSON)
                jsonPath("$.data.length()") { value(10) }
            }
        }
    }
}
