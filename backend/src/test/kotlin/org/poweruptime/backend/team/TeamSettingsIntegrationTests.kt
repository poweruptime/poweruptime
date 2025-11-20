package org.poweruptime.backend.team

import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.poweruptime.backend.configuration.toJSON
import org.poweruptime.backend.core.*
import org.poweruptime.backend.features.info.dto.SettingStringDto
import org.poweruptime.backend.features.info.instanceSetting.InstanceSettingService
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.*
import java.time.ZoneId

class TeamSettingsIntegrationTests(
    @Autowired val mockMvc: MockMvc,
    @Autowired val instanceSettingService: InstanceSettingService
) : BaseTestWithReusingContainers() {
    @Nested
    @DisplayName("API Get /v1/team/{teamId}/setting")
    inner class GetTeamSettings {
        @Test
        fun `test if secured`() {
            mockMvc.get("/v1/team/4Lxhu5YKWPBr/setting").andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser(MockUsers.USER3)
        fun `test if secured with wrong team user`() {
            mockMvc.get("/v1/team/4Lxhu5YKWPBr/setting").andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockUser(MockUsers.USER2)
        fun `test if secured with team user`() {
            mockMvc.get("/v1/team/4Lxhu5YKWPBr/setting").andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test success with admin`() {
            mockMvc.get("/v1/team/4Lxhu5YKWPBr/setting").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.timezone") { value("UTC") }
                    jsonPath("$.checkResultRetentionPeriodInDays") { value(365) }
                    jsonPath("$.checkResultLogRetentionPeriodInDays") { value(182) }
                }
            }
        }

        @Test
        @MockUser
        @ClearInitDatabase
        fun `test success with team admin user`() {
            mockMvc.get("/v1/team/4Lxhu5YKWPBr/setting").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.timezone") { value("UTC") }
                    jsonPath("$.checkResultRetentionPeriodInDays") { value(365) }
                    jsonPath("$.checkResultLogRetentionPeriodInDays") { value(182) }
                }
            }
        }
    }

    @Nested
    @DisplayName("API Put /v1/team/{teamId}/setting/timezone")
    inner class UpdateTeamTimeZone {
        @Test
        fun `test if secured`() {
            mockMvc.put("/v1/team/4Lxhu5YKWPBr/setting/timezone") {
                contentType = MediaType.APPLICATION_JSON
                content = SettingStringDto("UTC").toJSON()
            }.andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser(MockUsers.USER2)
        fun `test if secured with team user`() {
            mockMvc.put("/v1/team/4Lxhu5YKWPBr/setting/timezone") {
                contentType = MediaType.APPLICATION_JSON
                content = SettingStringDto("UTC").toJSON()
            }.andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockUser(MockUsers.USER3)
        fun `test if secured with wrong team user`() {
            mockMvc.put("/v1/team/4Lxhu5YKWPBr/setting/timezone") {
                contentType = MediaType.APPLICATION_JSON
                content = SettingStringDto("UTC").toJSON()
            }.andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        fun `test invalid timezone`() {
            mockMvc.put("/v1/team/4Lxhu5YKWPBr/setting/timezone") {
                contentType = MediaType.APPLICATION_JSON
                content = SettingStringDto("Invalid/ZoneId").toJSON()
            }.andExpect {
                status { isNotFound() }
            }
        }

        @Test
        @MockAdmin
        fun `test success with admin`() {
            mockMvc.put("/v1/team/4Lxhu5YKWPBr/setting/timezone") {
                contentType = MediaType.APPLICATION_JSON
                content = SettingStringDto("Europe/Berlin").toJSON()
            }.andExpect {
                status { isAccepted() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.timezone") { value("Europe/Berlin") }
                }
            }
        }

        @Test
        @MockUser
        @ClearInitDatabase
        fun `test success instance setting change affecting default team setting`() {
            mockMvc.get("/v1/team/4Lxhu5YKWPBr/setting").andExpect {
                status { isOk() }
                content {
                    jsonPath("$.timezone") { value("UTC") }
                }
            }

            instanceSettingService.setTimeZone(ZoneId.of("Europe/Berlin"))

            mockMvc.get("/v1/team/4Lxhu5YKWPBr/setting").andExpect {
                status { isOk() }
                content {
                    jsonPath("$.timezone") { value("Europe/Berlin") }
                }
            }
        }

        @Test
        @MockUser
        fun `test success with team admin user`() {
            mockMvc.put("/v1/team/4Lxhu5YKWPBr/setting/timezone") {
                contentType = MediaType.APPLICATION_JSON
                content = SettingStringDto("Asia/Tokyo").toJSON()
            }.andExpect {
                status { isAccepted() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.timezone") { value("Asia/Tokyo") }
                }
            }
        }

        @Test
        @MockAdmin
        fun `test timezone persistence`() {
            mockMvc.put("/v1/team/4Lxhu5YKWPBr/setting/timezone") {
                contentType = MediaType.APPLICATION_JSON
                content = SettingStringDto("Australia/Sydney").toJSON()
            }.andExpect {
                status { isAccepted() }
            }

            mockMvc.get("/v1/team/4Lxhu5YKWPBr/setting").andExpect {
                status { isOk() }
                content {
                    jsonPath("$.timezone") { value("Australia/Sydney") }
                }
            }
        }
    }
}
