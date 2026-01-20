package org.poweruptime.backend.team

import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.poweruptime.backend.configuration.toJSON
import org.poweruptime.backend.core.*
import org.poweruptime.backend.features.team.model.TeamRole
import org.poweruptime.backend.features.team.service.TeamJoinTokenService
import org.poweruptime.backend.features.team.service.TeamService
import org.poweruptime.backend.features.user.service.UserService
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.*

class TeamUserIntegrationTests(@Autowired val mockMvc: MockMvc) : BaseTestWithReusingContainers() {
    @Nested
    @DisplayName("API Get /v1/team/user")
    inner class GetTeamUsers {
        @Test
        fun `test if secured`() {
            mockMvc.get("/v1/team/4Lxhu5YKWPBr/user").andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser(MockUsers.USER3)
        fun `test if secured with wrong team user`() {
            mockMvc.get("/v1/team/4Lxhu5YKWPBr/user").andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockUser
        fun `test if user fail not found`() {
            mockMvc.get("/v1/team/abcdefg/user").andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        fun `test if admin fail not found`() {
            mockMvc.get("/v1/team/abcdefg/user").andExpect {
                status { isNotFound() }
            }
        }

        @Test
        @MockUser(MockUsers.USER2)
        @ClearInitDatabase
        fun `test if team user fails`() {
            mockMvc.get("/v1/team/4Lxhu5YKWPBr/user").andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test success with admin`() {
            mockMvc.get("/v1/team/4Lxhu5YKWPBr/user").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    content {
                        jsonPath("data.length()") { value(2) }
                    }
                }
            }
        }

        @Test
        @MockUser
        @ClearInitDatabase
        fun `test success with team admin user`() {
            mockMvc.get("/v1/team/4Lxhu5YKWPBr/user").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    content {
                        jsonPath("data.length()") { value(2) }
                    }
                }
            }
        }

        @Test
        @MockUser(MockUsers.USER3)
        @ClearInitDatabase
        fun `test success with other team admin user`() {
            mockMvc.get("/v1/team/wERfKhghD98U/user").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    content {
                        jsonPath("data.length()") { value(1) }
                    }
                }
            }
        }
    }

    @Nested
    @DisplayName("API Post /v1/team/user")
    inner class InviteUserToJoinTeam {
        @Test
        fun `test if secured`() {
            mockMvc
                .post("/v1/team/4Lxhu5YKWPBr/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = ModelFactory.getInviteTeamUserDto().toJSON()
                }.andExpect {
                    status { isUnauthorized() }
                }
        }

        @Test
        @MockUser
        fun `test if unknown team fails with user`() {
            mockMvc
                .post("/v1/team/1234ddd/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = ModelFactory.getInviteTeamUserDto().toJSON()
                }.andExpect {
                    status { isForbidden() }
                }
        }

        @Test
        @MockAdmin
        fun `test if unknown team fails with admin`() {
            mockMvc
                .post("/v1/team/1234ddd/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = ModelFactory.getInviteTeamUserDto().toJSON()
                }.andExpect {
                    status { isNotFound() }
                }
        }

        @Test
        @MockUser
        fun `test if unknown email fails`() {
            mockMvc
                .post("/v1/team/4Lxhu5YKWPBr/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = ModelFactory.getInviteTeamUserDto().toJSON()
                }.andExpect {
                    status { isNotFound() }
                }
        }

        @Test
        @MockUser(MockUsers.USER2)
        fun `test if team member fails`() {
            mockMvc
                .post("/v1/team/4Lxhu5YKWPBr/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = ModelFactory.getInviteTeamUserDto().toJSON()
                }.andExpect {
                    status { isForbidden() }
                }
        }

        @Test
        @MockUser
        @ClearInitDatabase
        fun `test success with team admin`() {
            val model = ModelFactory.getInviteTeamUserDto(email = "test4@test.org")
            mockMvc
                .post("/v1/team/4Lxhu5YKWPBr/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = model.toJSON()
                }.andExpect {
                    status { isCreated() }
                    content {
                        contentType(MediaType.APPLICATION_JSON)
                        content {
                            jsonPath("$.id") { exists() }
                        }
                    }
                }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test success with admin`() {
            mockMvc
                .post("/v1/team/4Lxhu5YKWPBr/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = ModelFactory.getInviteTeamUserDto(email = "test4@test.org").toJSON()
                }.andExpect {
                    status { isCreated() }
                    content {
                        contentType(MediaType.APPLICATION_JSON)
                        content {
                            jsonPath("$.id") { exists() }
                        }
                    }
                }
        }

        @Test
        @MockUser
        fun `test if already in fails`() {
            mockMvc
                .post("/v1/team/4Lxhu5YKWPBr/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = ModelFactory.getInviteTeamUserDto(email = "test2@test.org").toJSON()
                }.andExpect {
                    status { isBadRequest() }
                }
        }
    }

    @Nested
    @DisplayName("API Put /v1/team/user")
    inner class UpdateTeamUser {
        @Test
        fun `test if secured`() {
            mockMvc
                .put("/v1/team/4Lxhu5YKWPBr/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = ModelFactory.getUpdateTeamUserDto().toJSON()
                }.andExpect {
                    status { isUnauthorized() }
                }
        }

        @Test
        @MockUser
        fun `test if unknown team fails with user`() {
            mockMvc
                .put("/v1/team/1234ddd/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = ModelFactory.getUpdateTeamUserDto().toJSON()
                }.andExpect {
                    status { isForbidden() }
                }
        }

        @Test
        @MockAdmin
        fun `test if unknown team fails with admin`() {
            mockMvc
                .put("/v1/team/1234ddd/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = ModelFactory.getUpdateTeamUserDto().toJSON()
                }.andExpect {
                    status { isNotFound() }
                }
        }

        @Test
        @MockUser
        fun `test if unknown userid fails`() {
            mockMvc
                .put("/v1/team/4Lxhu5YKWPBr/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = ModelFactory.getUpdateTeamUserDto().toJSON()
                }.andExpect {
                    status { isNotFound() }
                }
        }

        @Test
        @MockUser
        @ClearInitDatabase
        fun `test if not in team userid fails`() {
            mockMvc
                .put("/v1/team/4Lxhu5YKWPBr/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = ModelFactory.getUpdateTeamUserDto(userId = "phECfcYSejyt").toJSON()
                }.andExpect {
                    status { isNotFound() }
                }
        }

        @Test
        @MockUser(MockUsers.USER2)
        fun `test if secured with team user`() {
            val model = ModelFactory.getUpdateTeamUserDto()
            mockMvc
                .put("/v1/team/4Lxhu5YKWPBr/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = model.toJSON()
                }.andExpect {
                    status { isForbidden() }
                }
        }

        @Test
        @MockUser(MockUsers.USER3)
        fun `test if secured with wrong team user`() {
            val model = ModelFactory.getUpdateTeamUserDto()
            mockMvc
                .put("/v1/team/4Lxhu5YKWPBr/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = model.toJSON()
                }.andExpect {
                    status { isForbidden() }
                }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test success with admin`() {
            val model = ModelFactory.getUpdateTeamUserDto(userId = "8BS4AaxuYG9h", role = TeamRole.ADMIN)
            mockMvc
                .put("/v1/team/4Lxhu5YKWPBr/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = model.toJSON()
                }.andExpect {
                    status { isOk() }
                    content {
                        contentType(MediaType.APPLICATION_JSON)
                        content {
                            jsonPath("$.user.id") { value(model.userId) }
                            jsonPath("$.role") { value(model.role.name) }
                        }
                    }
                }
        }

        @Test
        @MockUser
        @ClearInitDatabase
        fun `test success with team admin user`() {
            val model = ModelFactory.getUpdateTeamUserDto(userId = "8BS4AaxuYG9h", role = TeamRole.ADMIN)
            mockMvc
                .put("/v1/team/4Lxhu5YKWPBr/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = model.toJSON()
                }.andExpect {
                    status { isOk() }
                    content {
                        contentType(MediaType.APPLICATION_JSON)
                        content {
                            jsonPath("$.user.id") { value(model.userId) }
                            jsonPath("$.role") { value(model.role.name) }
                        }
                    }
                }
        }
    }

    @Nested
    @DisplayName("API Delete /v1/team/user")
    inner class DeleteTeamUser {
        @Test
        fun `test if secured`() {
            mockMvc.delete("/v1/team/4Lxhu5YKWPBr/user/8BS4AaxuYG9h").andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockAdmin
        fun `test if admin fail not found`() {
            mockMvc.delete("/v1/team/abcdefg/user/8BS4AaxuYG9h").andExpect {
                status { isNotFound() }
            }
        }

        @Test
        @MockUser
        fun `test if user fail not found`() {
            mockMvc.delete("/v1/team/abcdefg/user/8BS4AaxuYG9h").andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockUser(MockUsers.USER2)
        fun `test secured with team user`() {
            mockMvc.delete("/v1/team/4Lxhu5YKWPBr/user/8BS4AaxuYG9h").andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockUser
        fun `test fail if user not in team`() {
            mockMvc.delete("/v1/team/4Lxhu5YKWPBr/user/2XxpcofD6Ubg").andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test success with admin`() {
            mockMvc.delete("/v1/team/4Lxhu5YKWPBr/user/8BS4AaxuYG9h").andExpect {
                status { isOk() }
            }
        }

        @Test
        @MockUser
        @ClearInitDatabase
        fun `test success with team admin`() {
            mockMvc.delete("/v1/team/4Lxhu5YKWPBr/user/8BS4AaxuYG9h").andExpect {
                status { isOk() }
            }
        }
    }
}

class TeamUserJoinIntegrationTests(
    @Autowired val userService: UserService,
    @Autowired val teamService: TeamService,
    @Autowired val teamJoinTokenService: TeamJoinTokenService,
    @Autowired val mockMvc: MockMvc,
) : BaseTestWithReusingContainers() {
    @Test
    @MockUser(MockUsers.USER4)
    fun `test if fail on not found`() {
        mockMvc.get("/v1/team/join/test1234").andExpect {
            status { isUnauthorized() }
        }
    }

    @Test
    @MockUser(MockUsers.USER3)
    fun `test if fail if other user tries to use token`() {
        val inviterTeam = teamService.getByPublicId("4Lxhu5YKWPBr") // Team 1
        val inviter = userService.getByPublicId("ccYmAsus39gG") // User 1
        val invitee = userService.getByPublicId("phECfcYSejyt") // User 4

        val token = teamJoinTokenService.create(
            inviterTeam = inviterTeam,
            inviter = inviter,
            invitee = invitee,
            role = TeamRole.MEMBER,
        )

        mockMvc.get("/v1/team/join/$token").andExpect {
            status { isUnauthorized() }
        }
    }

    @Test
    @MockUser(MockUsers.USER2)
    fun `test if fail if same user tries to join again`() {
        val inviterTeam = teamService.getByPublicId("4Lxhu5YKWPBr") // Team 1
        val inviter = userService.getByPublicId("ccYmAsus39gG") // User 1
        val invitee = userService.getByPublicId("8BS4AaxuYG9h") // User 2

        val token = teamJoinTokenService.create(
            inviterTeam = inviterTeam,
            inviter = inviter,
            invitee = invitee,
            role = TeamRole.MEMBER,
        )

        mockMvc.get("/v1/team/join/$token").andExpect {
            status { isUnauthorized() }
        }
    }

    @Test
    @MockUser(MockUsers.USER4)
    @ClearInitDatabase
    fun `test success`() {
        val inviterTeam = teamService.getByPublicId("4Lxhu5YKWPBr") // Team 1
        val inviter = userService.getByPublicId("ccYmAsus39gG") // User 1
        val invitee = userService.getByPublicId("phECfcYSejyt") // User 4

        val token = teamJoinTokenService.create(
            inviterTeam = inviterTeam,
            inviter = inviter,
            invitee = invitee,
            role = TeamRole.MEMBER,
        )

        mockMvc.get("/v1/team/join/$token").andExpect {
            status { isOk() }
        }
    }

    @Test
    @MockUser(MockUsers.USER4)
    @ClearInitDatabase
    fun `test success token not usable again`() {
        val inviterTeam = teamService.getByPublicId("4Lxhu5YKWPBr") // Team 1
        val inviter = userService.getByPublicId("ccYmAsus39gG") // User 1
        val invitee = userService.getByPublicId("phECfcYSejyt") // User 4

        val token = teamJoinTokenService.create(
            inviterTeam = inviterTeam,
            inviter = inviter,
            invitee = invitee,
            role = TeamRole.MEMBER,
        )

        mockMvc.get("/v1/team/join/$token").andExpect {
            status { isOk() }
        }

        mockMvc.get("/v1/team/join/$token").andExpect {
            status { isUnauthorized() }
        }
    }
}
