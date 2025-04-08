package org.poweruptime.backend.team

import org.hamcrest.Matchers.hasItem
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.poweruptime.backend.configuration.toJSON
import org.poweruptime.backend.core.*
import org.poweruptime.backend.features.instanceSetting.InstanceSettingService
import org.poweruptime.backend.features.team.dto.TeamResponse
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.*

class TeamIntegrationTests(
    @Autowired val mockMvc: MockMvc,
    @Autowired val instanceSettingService: InstanceSettingService
) : BaseTestWithReusingContainers() {
    @Nested
    @DisplayName("API Get /v1/team")
    inner class GetTeam {
        @Test
        fun `test if secured`() {
            mockMvc.get("/v1/team/4Lxhu5YKWPBr").andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser(MockUsers.USER3)
        fun `test if secured with wrong team user`() {
            mockMvc.get("/v1/team/4Lxhu5YKWPBr").andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockUser
        fun `test if user fail not found`() {
            mockMvc.get("/v1/team/abcdefg").andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        fun `test if admin fail not found`() {
            mockMvc.get("/v1/team/abcdefg").andExpect {
                status { isNotFound() }
            }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test success with admin`() {
            mockMvc.get("/v1/team/4Lxhu5YKWPBr").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    content {
                        jsonPath("$.id") { value("4Lxhu5YKWPBr") }
                    }
                }
            }
        }

        @Test
        @MockUser
        @ClearInitDatabase
        fun `test success with team admin user`() {
            mockMvc.get("/v1/team/4Lxhu5YKWPBr").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    content {
                        jsonPath("$.id") { value("4Lxhu5YKWPBr") }
                    }
                }
            }
        }

        @Test
        @MockUser(MockUsers.USER2)
        @ClearInitDatabase
        fun `test success with team user`() {
            mockMvc.get("/v1/team/4Lxhu5YKWPBr").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    content {
                        jsonPath("$.id") { value("4Lxhu5YKWPBr") }
                    }
                }
            }
        }
    }

    @Nested
    @DisplayName("API Get all /v1/team")
    inner class GetAllTeams {
        @Test
        fun `test if secured`() {
            mockMvc.get("/v1/team").andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test if accessible with admin user`() {
            mockMvc.get("/v1/team?page=0&size=10").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.data.length()") { value(8) }
                    jsonPath("$.data[0].name") { hasItem("First Team") }
                    jsonPath("$.data[1].name") { hasItem("Second Team") }
                    jsonPath("$.data[2].name") { hasItem("Third Team") }
                }
            }
        }

        @Test
        @MockUser
        @ClearInitDatabase
        fun `test if accessible with team admin`() {
            mockMvc.get("/v1/team?page=0&size=10").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.data.length()") { value(1) }
                    jsonPath("$.data[0].name") { hasItem("First Team") }
                }
            }
        }

        @Test
        @MockUser(MockUsers.USER2)
        @ClearInitDatabase
        fun `test if accessible with team user`() {
            mockMvc.get("/v1/team?page=0&size=10").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.data.length()") { value(1) }
                    jsonPath("$.data[0].name") { hasItem("First Team") }
                }
            }
        }

        @Test
        @MockUser(MockUsers.USER3)
        @ClearInitDatabase
        fun `test if accessible with other team user`() {
            mockMvc.get("/v1/team?page=0&size=10").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.data.length()") { value(1) }
                    jsonPath("$.data[0].name") { hasItem("Second Team") }
                }
            }
        }

        @Test
        @MockUser(MockUsers.USER4)
        @ClearInitDatabase
        fun `test if accessible with no team`() {
            mockMvc.get("/v1/team?page=0&size=10").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.data.length()") { value(0) }
                }
            }
        }
    }

    @Nested
    @DisplayName("API Post /v1/team")
    inner class CreateTeam {
        @Test
        fun `test if secured`() {
            mockMvc.post("/v1/team") {
                contentType = MediaType.APPLICATION_JSON
                content = ModelFactory.getCreateTeamDto().toJSON()
            }.andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser
        fun `test if instance setting works`() {
            instanceSettingService.setUserAllowedToCreateTeams(false)
            val model = ModelFactory.getCreateTeamDto()
            mockMvc.post("/v1/team") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockUser
        fun `test success with user`() {
            instanceSettingService.setUserAllowedToCreateTeams(true)
            val model = ModelFactory.getCreateTeamDto()
            mockMvc.post("/v1/team") {
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
            val model = ModelFactory.getCreateTeamDto()
            val (teamId) = mockMvc.post("/v1/team") {
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
            }.andReturn().toDto<TeamResponse>()

            // Checks if user has team member access
            mockMvc.get("/v1/team/$teamId").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    content {
                        jsonPath("$.id") { value(teamId) }
                        jsonPath("$.name") { value(model.name) }
                    }
                }
            }

            // Checks if user has team admin access
            mockMvc.delete("/v1/team/$teamId").andExpect {
                status { isOk() }
            }
        }

        @Test
        @MockAdmin
        fun `test success with admin`() {
            val model = ModelFactory.getCreateTeamDto()
            mockMvc.post("/v1/team") {
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
    }

    @Nested
    @DisplayName("API Put /v1/team")
    inner class UpdateTeam {
        @Test
        fun `test if secured`() {
            mockMvc.put("/v1/team") {
                contentType = MediaType.APPLICATION_JSON
                content = ModelFactory.getUpdateTeamDto("4Lxhu5YKWPBr").toJSON()
            }.andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser(MockUsers.USER2)
        fun `test if secured with team user`() {
            val model = ModelFactory.getUpdateTeamDto("4Lxhu5YKWPBr")
            mockMvc.put("/v1/team") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockUser(MockUsers.USER3)
        fun `test if secured with wrong team user`() {
            val model = ModelFactory.getUpdateTeamDto("4Lxhu5YKWPBr")
            mockMvc.put("/v1/team") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        fun `test success with admin`() {
            val model = ModelFactory.getUpdateTeamDto("4Lxhu5YKWPBr", "Test Updated Team 2")
            mockMvc.put("/v1/team") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    content {
                        jsonPath("$.id") { value("4Lxhu5YKWPBr") }
                        jsonPath("$.name") { value(model.name) }
                    }
                }
            }
        }

        @Test
        @MockUser
        fun `test success with team admin user`() {
            val model = ModelFactory.getUpdateTeamDto("4Lxhu5YKWPBr")
            mockMvc.put("/v1/team") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    content {
                        jsonPath("$.id") { value("4Lxhu5YKWPBr") }
                        jsonPath("$.name") { value(model.name) }
                    }
                }
            }
        }
    }

    @Nested
    @DisplayName("API Delete /v1/team")
    inner class DeleteTeam {
        @Test
        fun `test if secured`() {
            mockMvc.delete("/v1/team/kLGeRaxXMM1t").andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockAdmin
        fun `test if admin fail not found`() {
            mockMvc.delete("/v1/team/abcdefg").andExpect {
                status { isNotFound() }
            }
        }

        @Test
        @MockUser
        fun `test if user fail not found`() {
            mockMvc.delete("/v1/team/abcdefg").andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockUser(MockUsers.USER2)
        fun `test secured with team user`() {
            mockMvc.delete("/v1/team/kLGeRaxXMM1t").andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        fun `test success with admin`() {
            mockMvc.delete("/v1/team/5GXzHe8YATsA").andExpect {
                status { isOk() }
            }
        }

        @Test
        @MockUser
        fun `test success with team admin`() {
            mockMvc.delete("/v1/team/4Lxhu5YKWPBr").andExpect {
                status { isOk() }
            }
        }
    }
}
