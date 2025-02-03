package org.poweruptime.backend

import org.hamcrest.Matchers.hasItem
import org.hamcrest.Matchers.not
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.poweruptime.backend.configuration.toJSON
import org.poweruptime.backend.core.BaseTestWithReusingContainers
import org.poweruptime.backend.core.ClearInitDatabase
import org.poweruptime.backend.core.MockAdmin
import org.poweruptime.backend.core.MockUser
import org.poweruptime.backend.core.ModelFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put

class SystemNotificationIntegrationTests(
    @Autowired val mockMvc: MockMvc
) : BaseTestWithReusingContainers() {

    @Nested
    @DisplayName("API Get /v1/system-notification/active")
    inner class GetSystemNotificationActive {
        @Test
        fun `test if secured`() {
            mockMvc.get("/v1/system-notification/active")
                .andExpect {
                    status { isUnauthorized() }
                }
        }

        @Test
        @MockAdmin
        fun `test if accessible with admin user`() {
            mockMvc.get("/v1/system-notification/active")
                .andExpect {
                    status { isOk() }
                    content {
                        contentType(MediaType.APPLICATION_JSON)
                        jsonPath("$.length()") { value(2) }
                        jsonPath("$[0].id") { value("KDemk18U55Wo") }
                        jsonPath("$[0].title") { value("Planned Maintenance 1") }
                        jsonPath("$[1].id") { value("hroof4wcGKgs") }
                        jsonPath("$[1].title") { value("Planned Maintenance 2") }
                    }
                }
        }

        @Test
        @MockUser
        @ClearInitDatabase
        fun `test if success`() {
            mockMvc.get("/v1/system-notification/active")
                .andExpect {
                    status { isOk() }
                    content {
                        contentType(MediaType.APPLICATION_JSON)
                        jsonPath("$.length()") { value(2) }
                        jsonPath("$[*].active") { not(hasItem(false)) }
                    }
                }
        }
    }

    @Nested
    @DisplayName("API Get all /v1/system-notification")
    inner class GetAllSystemNotificationActive {
        @Test
        fun `test if secured`() {
            mockMvc.get("/v1/system-notification")
                .andExpect {
                    status { isUnauthorized() }
                }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test if accessible with admin user`() {
            mockMvc.get("/v1/system-notification")
                .andExpect {
                    status { isOk() }
                    content {
                        contentType(MediaType.APPLICATION_JSON)
                        jsonPath("$.length()") { value(3) }
                        jsonPath("$[0].active") { hasItem(true) }
                        jsonPath("$[1].active") { hasItem(true) }
                        jsonPath("$[2].active") { hasItem(true) }
                    }
                }
        }

        @Test
        @MockUser
        fun `test if accessible with organisation user`() {
            mockMvc.get("/v1/system-notification")
                .andExpect {
                    status { isForbidden() }
                }
        }
    }

    @Nested
    @DisplayName("API Post /v1/system-notification")
    inner class CreateSystemNotification {
        @Test
        fun `test if secured`() {
            mockMvc.post("/v1/system-notification") {
                contentType = MediaType.APPLICATION_JSON
                content = ModelFactory.getCreateSystemNotification().toJSON()
            }.andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser
        fun `test if role check is in place`() {
            mockMvc.post("/v1/system-notification") {
                contentType = MediaType.APPLICATION_JSON
                content = ModelFactory.getCreateSystemNotification().toJSON()
            }.andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        fun `test success`() {
            val model = ModelFactory.getCreateSystemNotification()
            mockMvc.post("/v1/system-notification") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isCreated() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    content {
                        jsonPath("$.id") { exists() }
                        jsonPath("$.title") { value(model.title) }
                    }
                }
            }
        }
    }

    @Nested
    @DisplayName("API Put /v1/system-notification")
    inner class UpdateSystemNotification {
        @Test
        fun `test if secured`() {
            mockMvc.put("/v1/system-notification") {
                contentType = MediaType.APPLICATION_JSON
                content = ModelFactory.getUpdateSystemNotification("KDemk18U55Wo").toJSON()
            }.andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser
        fun `test if role check is in place`() {
            mockMvc.put("/v1/system-notification") {
                contentType = MediaType.APPLICATION_JSON
                content = ModelFactory.getUpdateSystemNotification("KDemk18U55Wo").toJSON()
            }.andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        fun `test success`() {
            val model = ModelFactory.getUpdateSystemNotification("KDemk18U55Wo")
            mockMvc.put("/v1/system-notification") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    content {
                        jsonPath("$.id") { value("KDemk18U55Wo") }
                        jsonPath("$.title") { value(model.title) }
                    }
                }
            }
        }
    }

    @Nested
    @DisplayName("API Delete /v1/system-notification")
    inner class DeleteSystemNotification {
        @Test
        fun `test if secured`() {
            mockMvc.delete("/v1/system-notification/hroof4wcGKgs")
                .andExpect {
                    status { isUnauthorized() }
                }
        }

        @Test
        @MockUser
        fun `test if role check is in place`() {
            mockMvc.delete("/v1/system-notification/hroof4wcGKgs")
                .andExpect {
                    status { isForbidden() }
                }
        }

        @Test
        @MockAdmin
        fun `test success`() {
            mockMvc.delete("/v1/system-notification/hroof4wcGKgs")
                .andExpect {
                    status { isOk() }
                }
        }
    }
}
