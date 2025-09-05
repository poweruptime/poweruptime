package org.poweruptime.backend.notification

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.poweruptime.backend.configuration.toJSON
import org.poweruptime.backend.core.*
import org.poweruptime.backend.features.info.instanceSetting.InstanceSettingService
import org.poweruptime.backend.features.mail.EmailSecurity
import org.poweruptime.backend.features.notification.dto.NotificationMethodResponse
import org.poweruptime.backend.features.notification.notificationMethods.discord.DiscordNotificationMethodDataRecord
import org.poweruptime.backend.features.notification.notificationMethods.email.EmailNotificationMethodDataRecord
import org.poweruptime.backend.features.notification.notificationMethods.slack.SlackNotificationMethodDataRecord
import org.poweruptime.backend.features.team.dto.TeamResponse
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.*

class NotificationMethodIntegrationTests(
    @Autowired val mockMvc: MockMvc,
    @Autowired val instanceSettingService: InstanceSettingService
) : BaseTestWithReusingContainers() {
    private val discordNotificationSenderData = DiscordNotificationMethodDataRecord(
        url = "https://test.at",
        displayName = null,
    )

    private val notificationSender = listOf(
        discordNotificationSenderData,
        SlackNotificationMethodDataRecord(
            url = "https://test.at",
        ),
        EmailNotificationMethodDataRecord(
            setOf("test@test.at"),
            "mail.test.at",
            1234,
            "test",
            "test",
            EmailSecurity.NONE_STARTTLS,
            false,
            cc = null,
            bcc = null,
        ),
    )

    @Nested
    @DisplayName("API Get /v1/notification-method")
    inner class GetNotificationMethod {
        @Test
        fun `test if secured`() {
            mockMvc.get("/v1/notification-method/UoKSMt62oFcX").andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser(MockUsers.USER3)
        fun `test if secured with wrong team user`() {
            mockMvc.get("/v1/notification-method/UoKSMt62oFcX").andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockUser
        fun `test if user fail not found`() {
            mockMvc.get("/v1/notification-method/abcdef").andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        fun `test if admin fail not found`() {
            mockMvc.get("/v1/notification-method/abcefe").andExpect {
                status { isNotFound() }
            }
        }

        @Test
        @MockAdmin
        fun `test success with admin`() {
            mockMvc.get("/v1/notification-method/UoKSMt62oFcX").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    content {
                        jsonPath("$.id") { value("UoKSMt62oFcX") }
                        jsonPath("$.type") { value("EMAIL") }
                        jsonPath("$.data._type") { value("EMAIL") }
                    }
                }
            }
        }

        @Test
        @MockUser
        fun `test success with team admin user`() {
            mockMvc.get("/v1/notification-method/UoKSMt62oFcX").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    content {
                        jsonPath("$.id") { value("UoKSMt62oFcX") }
                        jsonPath("$.type") { value("EMAIL") }
                        jsonPath("$.data._type") { value("EMAIL") }
                    }
                }
            }
        }

        @Test
        @MockUser(MockUsers.USER2)
        fun `test success with team user`() {
            mockMvc.get("/v1/notification-method/UoKSMt62oFcX").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    content {
                        jsonPath("$.id") { value("UoKSMt62oFcX") }
                        jsonPath("$.type") { value("EMAIL") }
                        jsonPath("$.data._type") { value("EMAIL") }
                    }
                }
            }
        }
    }

    @Nested
    @DisplayName("API Get all /v1/notification-method")
    inner class GetAllNotificationMethods {
        @Test
        fun `test if secured`() {
            mockMvc.get("/v1/notification-method").andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser(MockUsers.USER3)
        @ClearInitDatabase
        fun `test if secured by permissions`() {
            mockMvc.get("/v1/notification-method?teamId=4Lxhu5YKWPBr&page=0&size=10").andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test if accessible with admin user`() {
            mockMvc.get("/v1/notification-method?teamId=4Lxhu5YKWPBr&page=0&size=10").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.data.length()") { value(3) }
                    jsonPath("$.data[0].name") { value("Test E-Mail") }
                }
            }
        }

        @Test
        @MockUser
        @ClearInitDatabase
        fun `test if accessible with team admin`() {
            mockMvc.get("/v1/notification-method?teamId=4Lxhu5YKWPBr&page=0&size=10").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.data.length()") { value(3) }
                    jsonPath("$.data[0].name") { value("Test E-Mail") }
                }
            }
        }

        @Test
        @MockUser(MockUsers.USER2)
        @ClearInitDatabase
        fun `test if accessible with team user`() {
            mockMvc.get("/v1/notification-method?teamId=4Lxhu5YKWPBr&page=0&size=10").andExpect {
                status { isOk() }
                content {
                    jsonPath("$.data.length()") { value(3) }
                    jsonPath("$.data[0].name") { value("Test E-Mail") }
                }
            }
        }

        @Test
        @MockUser(MockUsers.USER3)
        @ClearInitDatabase
        fun `test if accessible with other team user`() {
            mockMvc.get("/v1/notification-method?teamId=wERfKhghD98U&page=0&size=10").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.data.length()") { value(0) }
                }
            }
        }
    }

    @Nested
    @DisplayName("API Post /v1/notification-method")
    inner class CreateNotificationMethod {
        @Test
        fun `test if secured`() {
            mockMvc.post("/v1/notification-method") {
                contentType = MediaType.APPLICATION_JSON
                content = ModelFactory.getCreateNotificationMethodDto(
                    discordNotificationSenderData,
                ).toJSON()
            }.andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser
        fun `test success with user`() {
            val model = ModelFactory.getCreateNotificationMethodDto(
                discordNotificationSenderData,
            )
            mockMvc.post("/v1/notification-method") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isCreated() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    content {
                        jsonPath("$.id") { exists() }
                        jsonPath("$.name") { value(model.name) }
                    }
                }
            }
        }

        @Test
        @MockUser
        fun `test success permission for newly created team`() {
            instanceSettingService.setUserAllowedToCreateTeams(true)
            val teamModel = ModelFactory.getCreateTeamDto()
            val (teamId) = mockMvc.post("/v1/team") {
                contentType = MediaType.APPLICATION_JSON
                content = teamModel.toJSON()
            }.andExpect {
                status { isCreated() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    content {
                        jsonPath("$.id") { exists() }
                        jsonPath("$.name") { value(teamModel.name) }
                    }
                }
            }.andReturn().toDto<TeamResponse>()

            val notificationMethodModel = ModelFactory.getCreateNotificationMethodDto(
                discordNotificationSenderData,
                teamId = teamId,
            )
            mockMvc.post("/v1/notification-method") {
                contentType = MediaType.APPLICATION_JSON
                content = notificationMethodModel.toJSON()
            }.andExpect {
                status { isCreated() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    content {
                        jsonPath("$.id") { exists() }
                        jsonPath("$.name") { value(notificationMethodModel.name) }
                    }
                }
            }
        }

        @Test
        @MockAdmin
        fun `test success with admin`() {
            val model = ModelFactory.getCreateNotificationMethodDto(
                discordNotificationSenderData,
            )
            mockMvc.post("/v1/notification-method") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isCreated() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    content {
                        jsonPath("$.id") { exists() }
                        jsonPath("$.name") { value(model.name) }
                    }
                }
            }
        }

        @Test
        @MockAdmin
        fun `test success all types`() {
            val createdNotificationMethods = notificationSender.map { data ->
                val model = ModelFactory.getCreateNotificationMethodDto(data)
                val notificationMethod = mockMvc.post("/v1/notification-method") {
                    contentType = MediaType.APPLICATION_JSON
                    content = model.toJSON()
                }.andExpect {
                    status { isCreated() }
                    content {
                        contentType(MediaType.APPLICATION_JSON)
                        content {
                            jsonPath("$.id") { exists() }
                            jsonPath("$.name") { value(model.name) }
                            jsonPath("$.type") { value(model.data._type.code) }
                            jsonPath("$.data._type") { value(model.data._type.code) }
                        }
                    }
                }.andReturn().toDto<NotificationMethodResponse>()

                assertThat(notificationMethod.data.toJSON()).isEqualTo(data.toJSON())

                notificationMethod.id
            }

            // Test updating
            createdNotificationMethods.forEach { id ->
                val model = notificationSender.random().let { data ->
                    ModelFactory.getUpdateNotificationMethodDto(id, data)
                }
                val monitor = mockMvc.put("/v1/notification-method") {
                    contentType = MediaType.APPLICATION_JSON
                    content = model.toJSON()
                }.andExpect {
                    status { isOk() }
                    content {
                        contentType(MediaType.APPLICATION_JSON)
                        content {
                            jsonPath("$.id") { value(id) }
                            jsonPath("$.name") { value(model.name) }
                            jsonPath("$.type") { value(model.data._type.code) }
                            jsonPath("$.data._type") { value(model.data._type.code) }
                        }
                    }
                }.andReturn().toDto<NotificationMethodResponse>()

                assertThat(monitor.data.toJSON()).isEqualTo(model.data.toJSON())
            }
        }
    }

    @Nested
    @DisplayName("API Put /v1/notification-method")
    inner class UpdateMonitor {
        @Test
        fun `test if secured`() {
            mockMvc.put("/v1/notification-method") {
                contentType = MediaType.APPLICATION_JSON
                content = ModelFactory.getUpdateNotificationMethodDto(
                    "UoKSMt62oFcX",
                    discordNotificationSenderData,
                ).toJSON()
            }.andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser(MockUsers.USER2)
        fun `test if secured with team user`() {
            val model = ModelFactory.getUpdateNotificationMethodDto(
                "UoKSMt62oFcX",
                discordNotificationSenderData,
            )
            mockMvc.put("/v1/notification-method") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockUser(MockUsers.USER3)
        fun `test if secured with wrong team user`() {
            val model = ModelFactory.getUpdateNotificationMethodDto(
                "UoKSMt62oFcX",
                discordNotificationSenderData,
            )
            mockMvc.put("/v1/notification-method") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        fun `test success with admin`() {
            val model = ModelFactory.getUpdateNotificationMethodDto(
                "UoKSMt62oFcX",
                discordNotificationSenderData,
            )
            mockMvc.put("/v1/notification-method") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    content {
                        jsonPath("$.id") { value("UoKSMt62oFcX") }
                        jsonPath("$.name") { value(model.name) }
                    }
                }
            }
        }

        @Test
        @MockUser
        fun `test success with team admin user`() {
            val model = ModelFactory.getUpdateNotificationMethodDto(
                "UoKSMt62oFcX",
                discordNotificationSenderData,
            )
            mockMvc.put("/v1/notification-method") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    content {
                        jsonPath("$.id") { value("UoKSMt62oFcX") }
                        jsonPath("$.name") { value(model.name) }
                    }
                }
            }
        }
    }

    @Nested
    @DisplayName("API Delete /v1/notification-method")
    inner class DeleteNotificationMethod {
        @Test
        fun `test if secured`() {
            mockMvc.delete("/v1/notification-method/gs7jTakASRSp").andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockAdmin
        fun `test if admin fail not found`() {
            mockMvc.delete("/v1/notification-method/abcdefbh").andExpect {
                status { isNotFound() }
            }
        }

        @Test
        @MockUser
        fun `test if user fail not found`() {
            mockMvc.delete("/v1/notification-method/abcdefbh").andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockUser(MockUsers.USER2)
        fun `test secured with team user`() {
            mockMvc.delete("/v1/notification-method/gs7jTakASRSp").andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        fun `test success with admin`() {
            mockMvc.delete("/v1/notification-method/TPAbk1uHLp7p").andExpect {
                status { isOk() }
            }
        }

        @Test
        @MockUser
        fun `test success with team admin`() {
            mockMvc.delete("/v1/notification-method/gs7jTakASRSp").andExpect {
                status { isOk() }
            }
        }
    }
}
