package org.poweruptime.backend

import org.hamcrest.CoreMatchers.hasItem
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.poweruptime.backend.configuration.toJSON
import org.poweruptime.backend.core.*
import org.poweruptime.backend.features.info.dto.SettingBooleanDto
import org.poweruptime.backend.features.info.dto.SettingStringDto
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.*

class InstanceSettingsIntegrationTests(
    @Autowired val mockMvc: MockMvc,
) : BaseTestWithReusingContainers() {
    @Nested
    @DisplayName("API Get /v1/instance-settings")
    inner class GetInstanceSettings {
        @Test
        fun `test if secured`() {
            mockMvc.get("/v1/instance-settings").andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser
        fun `test if secured with non-admin user`() {
            mockMvc.get("/v1/instance-settings").andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test success with admin`() {
            mockMvc.get("/v1/instance-settings").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.supportLookup") { value(null) }
                    jsonPath("$.timezone") { value("UTC") }
                    jsonPath("$.isUserAllowedToCreateTeams") { value(false) }
                    jsonPath("$.checkResultRetentionPeriodInDays") { value(365) }
                    jsonPath("$.checkResultLogRetentionPeriodInDays") { value(182) }
                    jsonPath("$.showSupportBadge") { value(true) }
                    jsonPath("$.versionCheckEnabled") { value(false) }
                    jsonPath("$.versionCheckAdminMailEnabled") { value(false) }
                    jsonPath("$.versionCheckAdminMailTo") { value(null) }
                    jsonPath("$.showNewVersionDialog") { value(true) }
                }
            }
        }
    }

    @Nested
    @DisplayName("API Get /v1/instance-settings/timezones")
    inner class GetAvailableTimezones {
        @Test
        fun `test if secured`() {
            mockMvc.get("/v1/instance-settings/timezones").andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser
        fun `test if secured with non-admin user`() {
            mockMvc.get("/v1/instance-settings/timezones").andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        fun `test success with admin`() {
            mockMvc.get("/v1/instance-settings/timezones").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.availableTimezones") { isArray() }
                }
            }
        }

        @Test
        @MockAdmin
        fun `test contains common timezones`() {
            mockMvc.get("/v1/instance-settings/timezones").andExpect {
                status { isOk() }
                content {
                    jsonPath("$.availableTimezones[*]") {
                        hasItem("UTC")
                        hasItem("Europe/Berlin")
                        hasItem("America/New_York")
                        hasItem("Asia/Tokyo")
                    }
                }
            }
        }
    }

    @Nested
    @DisplayName("API Put /v1/instance-settings/timezone")
    inner class UpdateInstanceTimeZone {
        @Test
        fun `test if secured`() {
            mockMvc.put("/v1/instance-settings/timezone") {
                contentType = MediaType.APPLICATION_JSON
                content = SettingStringDto("UTC").toJSON()
            }.andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser
        fun `test if secured with non-admin user`() {
            mockMvc.put("/v1/instance-settings/timezone") {
                contentType = MediaType.APPLICATION_JSON
                content = SettingStringDto("UTC").toJSON()
            }.andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        fun `test invalid timezone`() {
            mockMvc.put("/v1/instance-settings/timezone") {
                contentType = MediaType.APPLICATION_JSON
                content = SettingStringDto("Invalid/ZoneId").toJSON()
            }.andExpect {
                status { isNotFound() }
            }
        }

        @Test
        @MockAdmin
        fun `test success with valid timezone UTC`() {
            mockMvc.put("/v1/instance-settings/timezone") {
                contentType = MediaType.APPLICATION_JSON
                content = SettingStringDto("UTC").toJSON()
            }.andExpect {
                status { isAccepted() }
                content {
                    jsonPath("$.timezone") { value("UTC") }
                }
            }
        }

        @Test
        @MockAdmin
        fun `test success with valid timezone EuropeBerlin`() {
            mockMvc.put("/v1/instance-settings/timezone") {
                contentType = MediaType.APPLICATION_JSON
                content = SettingStringDto("Europe/Berlin").toJSON()
            }.andExpect {
                status { isAccepted() }
                content {
                    jsonPath("$.timezone") { value("Europe/Berlin") }
                }
            }
        }

        @Test
        @MockAdmin
        fun `test success with valid timezone AsiaTokyo`() {
            mockMvc.put("/v1/instance-settings/timezone") {
                contentType = MediaType.APPLICATION_JSON
                content = SettingStringDto("Asia/Tokyo").toJSON()
            }.andExpect {
                status { isAccepted() }
                content {
                    jsonPath("$.timezone") { value("Asia/Tokyo") }
                }
            }
        }

        @Test
        @MockAdmin
        fun `test timezone persistence`() {
            mockMvc.put("/v1/instance-settings/timezone") {
                contentType = MediaType.APPLICATION_JSON
                content = SettingStringDto("Australia/Sydney").toJSON()
            }.andExpect {
                status { isAccepted() }
            }

            mockMvc.get("/v1/instance-settings").andExpect {
                status { isOk() }
                content {
                    jsonPath("$.timezone") { value("Australia/Sydney") }
                }
            }
        }
    }

    @Nested
    @DisplayName("API Put /v1/instance-settings/support")
    inner class UpdateInstanceSupport {
        @Test
        fun `test if secured`() {
            mockMvc.put("/v1/instance-settings/support") {
                contentType = MediaType.APPLICATION_JSON
                content = ModelFactory.getInstanceSettingSupportDto().toJSON()
            }.andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser
        fun `test if secured with non-admin user`() {
            val model = ModelFactory.getInstanceSettingSupportDto()
            mockMvc.put("/v1/instance-settings/support") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        fun `test set support lookup`() {
            val model = ModelFactory.getInstanceSettingSupportDto(
                supportLookup = "test-support-id",
                showSupportBadge = true,
            )
            mockMvc.put("/v1/instance-settings/support") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isAccepted() }
                content {
                    jsonPath("$.instanceSettings.supportLookup") { exists() }
                    jsonPath("$.instanceSettings.showSupportBadge") { value(true) }
                }
            }
        }

        @Test
        @MockAdmin
        fun `test clear support lookup`() {
            val model = ModelFactory.getInstanceSettingSupportDto(
                supportLookup = null,
                showSupportBadge = false,
            )
            mockMvc.put("/v1/instance-settings/support") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isAccepted() }
                content {
                    jsonPath("$.instanceSettings.showSupportBadge") { value(false) }
                }
            }
        }

        @Test
        @MockAdmin
        fun `test toggle show support badge`() {
            val model = ModelFactory.getInstanceSettingSupportDto(
                supportLookup = "some-id",
                showSupportBadge = true,
            )
            mockMvc.put("/v1/instance-settings/support") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isAccepted() }
                content {
                    jsonPath("$.instanceSettings.showSupportBadge") { value(true) }
                }
            }
        }

        @Test
        @MockAdmin
        fun `test support persistence`() {
            val model = ModelFactory.getInstanceSettingSupportDto(
                supportLookup = "persist-id",
                showSupportBadge = true,
            )
            mockMvc.put("/v1/instance-settings/support") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isAccepted() }
            }

            mockMvc.get("/v1/instance-settings").andExpect {
                status { isOk() }
                content {
                    jsonPath("$.showSupportBadge") { value(true) }
                }
            }
        }
    }

    @Nested
    @DisplayName("API Put /v1/instance-settings/isUserAllowedToCreateTeams")
    inner class UpdateIsUserAllowedToCreateTeams {
        @Test
        fun `test if secured`() {
            mockMvc.put("/v1/instance-settings/isUserAllowedToCreateTeams") {
                contentType = MediaType.APPLICATION_JSON
                content = SettingBooleanDto(true).toJSON()
            }.andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser
        fun `test if secured with non-admin user`() {
            mockMvc.put("/v1/instance-settings/isUserAllowedToCreateTeams") {
                contentType = MediaType.APPLICATION_JSON
                content = SettingBooleanDto(true).toJSON()
            }.andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        fun `test enable user create teams`() {
            mockMvc.put("/v1/instance-settings/isUserAllowedToCreateTeams") {
                contentType = MediaType.APPLICATION_JSON
                content = SettingBooleanDto(true).toJSON()
            }.andExpect {
                status { isAccepted() }
                content {
                    jsonPath("$.isUserAllowedToCreateTeams") { value(true) }
                }
            }
        }

        @Test
        @MockAdmin
        fun `test enable and disable user create teams`() {
            mockMvc.put("/v1/instance-settings/isUserAllowedToCreateTeams") {
                contentType = MediaType.APPLICATION_JSON
                content = SettingBooleanDto(true).toJSON()
            }.andExpect {
                status { isAccepted() }
                content {
                    jsonPath("$.isUserAllowedToCreateTeams") { value(true) }
                }
            }

            mockMvc.get("/v1/instance-settings").andExpect {
                status { isOk() }
                content {
                    jsonPath("$.isUserAllowedToCreateTeams") { value(true) }
                }
            }

            mockMvc.put("/v1/instance-settings/isUserAllowedToCreateTeams") {
                contentType = MediaType.APPLICATION_JSON
                content = SettingBooleanDto(false).toJSON()
            }.andExpect {
                status { isAccepted() }
                content {
                    jsonPath("$.isUserAllowedToCreateTeams") { value(false) }
                }
            }

            mockMvc.get("/v1/instance-settings").andExpect {
                status { isOk() }
                content {
                    jsonPath("$.isUserAllowedToCreateTeams") { value(false) }
                }
            }
        }

        @Test
        @MockAdmin
        fun `test persistence`() {
            mockMvc.put("/v1/instance-settings/isUserAllowedToCreateTeams") {
                contentType = MediaType.APPLICATION_JSON
                content = SettingBooleanDto(true).toJSON()
            }.andExpect {
                status { isAccepted() }
            }

            mockMvc.get("/v1/instance-settings").andExpect {
                status { isOk() }
                content {
                    jsonPath("$.isUserAllowedToCreateTeams") { value(true) }
                }
            }
        }
    }

    @Nested
    @DisplayName("API Put /v1/instance-settings/showNewVersionDialog")
    inner class UpdateShowNewVersionDialog {
        @Test
        fun `test if secured`() {
            mockMvc.put("/v1/instance-settings/showNewVersionDialog") {
                contentType = MediaType.APPLICATION_JSON
                content = SettingBooleanDto(true).toJSON()
            }.andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser
        fun `test if secured with non-admin user`() {
            mockMvc.put("/v1/instance-settings/showNewVersionDialog") {
                contentType = MediaType.APPLICATION_JSON
                content = SettingBooleanDto(true).toJSON()
            }.andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        fun `test enable show new version dialog`() {
            mockMvc.put("/v1/instance-settings/showNewVersionDialog") {
                contentType = MediaType.APPLICATION_JSON
                content = SettingBooleanDto(true).toJSON()
            }.andExpect {
                status { isAccepted() }
                content {
                    jsonPath("$.showNewVersionDialog") { value(true) }
                }
            }
        }

        @Test
        @MockAdmin
        fun `test disable show new version dialog`() {
            mockMvc.put("/v1/instance-settings/showNewVersionDialog") {
                contentType = MediaType.APPLICATION_JSON
                content = SettingBooleanDto(false).toJSON()
            }.andExpect {
                status { isAccepted() }
                content {
                    jsonPath("$.showNewVersionDialog") { value(false) }
                }
            }
        }
    }

    @Nested
    @DisplayName("API Put /v1/instance-settings/retention")
    inner class UpdateInstanceRetention {
        @Test
        fun `test if secured`() {
            mockMvc.put("/v1/instance-settings/retention") {
                contentType = MediaType.APPLICATION_JSON
                content = ModelFactory.getInstanceSettingRetentionDto().toJSON()
            }.andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser
        fun `test if secured with non-admin user`() {
            val model = ModelFactory.getInstanceSettingRetentionDto()
            mockMvc.put("/v1/instance-settings/retention") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        fun `test update check result retention`() {
            val model = ModelFactory.getInstanceSettingRetentionDto(
                checkResultRetentionPeriodInDays = 60,
            )
            mockMvc.put("/v1/instance-settings/retention") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isAccepted() }
                content {
                    jsonPath("$.checkResultRetentionPeriodInDays") { value(60) }
                }
            }
        }

        @Test
        @MockAdmin
        fun `test update check result log retention`() {
            val model = ModelFactory.getInstanceSettingRetentionDto(
                checkResultLogRetentionPeriodInDays = 30,
            )
            mockMvc.put("/v1/instance-settings/retention") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isAccepted() }
                content {
                    jsonPath("$.checkResultLogRetentionPeriodInDays") {
                        value(30)
                    }
                }
            }
        }

        @Test
        @MockAdmin
        fun `test update both retention values`() {
            val model = ModelFactory.getInstanceSettingRetentionDto(
                checkResultRetentionPeriodInDays = 90,
                checkResultLogRetentionPeriodInDays = 45,
            )
            mockMvc.put("/v1/instance-settings/retention") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isAccepted() }
                content {
                    jsonPath("$.checkResultRetentionPeriodInDays") { value(90) }
                    jsonPath("$.checkResultLogRetentionPeriodInDays") {
                        value(45)
                    }
                }
            }
        }

        @Test
        @MockAdmin
        fun `test retention persistence`() {
            val model = ModelFactory.getInstanceSettingRetentionDto(
                checkResultRetentionPeriodInDays = 120,
                checkResultLogRetentionPeriodInDays = 60,
            )
            mockMvc.put("/v1/instance-settings/retention") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isAccepted() }
            }

            mockMvc.get("/v1/instance-settings").andExpect {
                status { isOk() }
                content {
                    jsonPath("$.checkResultRetentionPeriodInDays") { value(120) }
                    jsonPath("$.checkResultLogRetentionPeriodInDays") { value(60) }
                }
            }
        }
    }

    @Nested
    @DisplayName("API Put /v1/instance-settings/versionCheck")
    inner class UpdateInstanceVersionCheck {
        @Test
        fun `test if secured`() {
            mockMvc.put("/v1/instance-settings/versionCheck") {
                contentType = MediaType.APPLICATION_JSON
                content = ModelFactory.getInstanceSettingVersionCheckDto().toJSON()
            }.andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser
        fun `test if secured with non-admin user`() {
            val model = ModelFactory.getInstanceSettingVersionCheckDto()
            mockMvc.put("/v1/instance-settings/versionCheck") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        fun `test enable version check`() {
            val model = ModelFactory.getInstanceSettingVersionCheckDto(
                versionCheckEnabled = true,
            )
            mockMvc.put("/v1/instance-settings/versionCheck") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isAccepted() }
                content {
                    jsonPath("$.versionCheckEnabled") { value(true) }
                }
            }
        }

        @Test
        @MockAdmin
        fun `test disable version check`() {
            val model = ModelFactory.getInstanceSettingVersionCheckDto(
                versionCheckEnabled = false,
            )
            mockMvc.put("/v1/instance-settings/versionCheck") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isAccepted() }
                content {
                    jsonPath("$.versionCheckEnabled") { value(false) }
                }
            }
        }

        @Test
        @MockAdmin
        fun `test enable admin mail`() {
            val model = ModelFactory.getInstanceSettingVersionCheckDto(
                versionCheckAdminMailEnabled = true,
                versionCheckAdminMailTo = setOf("admin@example.com"),
            )
            mockMvc.put("/v1/instance-settings/versionCheck") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isAccepted() }
                content {
                    jsonPath("$.versionCheckAdminMailEnabled") { value(true) }
                }
            }
        }

        @Test
        @MockAdmin
        fun `test multiple admin emails`() {
            val model = ModelFactory.getInstanceSettingVersionCheckDto(
                versionCheckAdminMailEnabled = true,
                versionCheckAdminMailTo = setOf(
                    "admin1@example.com",
                    "admin2@example.com",
                ),
            )
            mockMvc.put("/v1/instance-settings/versionCheck") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isAccepted() }
                content {
                    jsonPath("$.versionCheckAdminMailEnabled") { value(true) }
                }
            }
        }

        @Test
        @MockAdmin
        fun `test version check persistence`() {
            val model = ModelFactory.getInstanceSettingVersionCheckDto(
                versionCheckEnabled = true,
                versionCheckAdminMailEnabled = true,
                versionCheckAdminMailTo = setOf("admin@example.com"),
            )
            mockMvc.put("/v1/instance-settings/versionCheck") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isAccepted() }
            }

            mockMvc.get("/v1/instance-settings").andExpect {
                status { isOk() }
                content {
                    jsonPath("$.versionCheckEnabled") { value(true) }
                    jsonPath("$.versionCheckAdminMailEnabled") { value(true) }
                }
            }
        }
    }

    @Nested
    @DisplayName("API Get /v1/instance-settings/versionCheck")
    inner class GetVersionCheck {
        @Test
        fun `test if secured`() {
            mockMvc.get("/v1/instance-settings/versionCheck").andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser
        fun `test if secured with non-admin user`() {
            mockMvc.get("/v1/instance-settings/versionCheck").andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        fun `test success with admin`() {
            mockMvc.get("/v1/instance-settings/versionCheck").andExpect {
                status { isOk() }
                content {
                    string("")
                }
            }
        }

        @Test
        @MockAdmin
        fun `test skip cache parameter`() {
            mockMvc.get("/v1/instance-settings/versionCheck?skipCache=true")
                .andExpect {
                    status { isOk() }
                    content {
                        string("")
                    }
                }
        }

        @Test
        @MockAdmin
        fun `test default skip cache is false`() {
            mockMvc.get("/v1/instance-settings/versionCheck").andExpect {
                status { isOk() }
                content {
                    string("")
                }
            }
        }
    }
}
