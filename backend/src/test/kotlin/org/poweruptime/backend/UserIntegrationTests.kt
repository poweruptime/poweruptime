package org.poweruptime.backend

import org.assertj.core.api.Assertions
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.poweruptime.backend.configuration.toJSON
import org.poweruptime.backend.core.*
import org.poweruptime.backend.core.dto.PaginatedResponse
import org.poweruptime.backend.features.authentication.model.SystemRole
import org.poweruptime.backend.features.team.dto.TeamResponse
import org.poweruptime.backend.features.user.UserResponse
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.*

class UserIntegrationTests(@Autowired val mockMvc: MockMvc) : BaseTestWithReusingContainers() {
    @Nested
    @DisplayName("API Get /v1/user/{id}")
    inner class GetUser {
        @Test
        fun `test if secured`() {
            mockMvc.get("/v1/user/someUserId").andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser
        fun `test if secured with non-admin user`() {
            mockMvc.get("/v1/user/someUserId").andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        fun `test if user not found`() {
            mockMvc.get("/v1/user/nonexistentId").andExpect {
                status { isNotFound() }
            }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test success with admin`() {
            mockMvc.get("/v1/user/phECfcYSejyt").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.id") { value("phECfcYSejyt") }
                    jsonPath("$.name") { exists() }
                    jsonPath("$.email") { exists() }
                    jsonPath("$.role") { exists() }
                    jsonPath("$.activated") { exists() }
                }
            }
        }
    }

    @Nested
    @DisplayName("API Get /v1/user")
    inner class GetAllUsers {
        @Test
        fun `test if secured`() {
            mockMvc.get("/v1/user").andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser
        fun `test if secured with non-admin user`() {
            mockMvc.get("/v1/user").andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test success with admin and default pagination`() {
            mockMvc.get("/v1/user?page=0&size=20").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.data") { isArray() }
//                    jsonPath("$.data.length()") { greaterThan(0) }
                    jsonPath("$.data[0].id") { exists() }
                    jsonPath("$.data[0].name") { exists() }
                    jsonPath("$.data[0].email") { exists() }
                    jsonPath("$.data[0].role") { exists() }
                    jsonPath("$.data[0].activated") { exists() }
                }
            }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test search by name`() {
            mockMvc.get("/v1/user?page=0&size=20&search=Admin").andExpect {
                status { isOk() }
                content {
                    jsonPath("$.data") { isArray() }
                }
            }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test filter by activated true`() {
            mockMvc.get("/v1/user?page=0&size=20&activated=true").andExpect {
                status { isOk() }
                content {
                    jsonPath("$.data") { isArray() }
                }
            }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test filter by activated false`() {
            mockMvc.get("/v1/user?page=0&size=20&activated=false").andExpect {
                status { isOk() }
                content {
                    jsonPath("$.data") { isArray() }
                }
            }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test filter by role ADMIN`() {
            mockMvc.get("/v1/user?page=0&size=20&role=ADMIN").andExpect {
                status { isOk() }
                content {
                    jsonPath("$.data") { isArray() }
                    jsonPath("$.data[*].role") { value("ADMIN") }
                }
            }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test filter by role USER`() {
            mockMvc.get("/v1/user?page=0&size=20&role=USER").andExpect {
                status { isOk() }
                content {
                    jsonPath("$.data") { isArray() }
                }
            }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test pagination`() {
            mockMvc.get("/v1/user?page=0&size=5").andExpect {
                status { isOk() }
                content {
                    jsonPath("$.numberOfItems") { value(6) }
                    jsonPath("$.data") { isArray() }
                }
            }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test combined filters search and role`() {
            mockMvc.get("/v1/user?page=0&size=20&search=user&role=USER").andExpect {
                status { isOk() }
                content {
                    jsonPath("$.data") { isArray() }
                }
            }
        }
    }

    @Nested
    @DisplayName("API Post /v1/user")
    inner class CreateUser {
        @Test
        fun `test if secured`() {
            mockMvc
                .post("/v1/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = ModelFactory.getCreateUserDto().toJSON()
                }.andExpect {
                    status { isUnauthorized() }
                }
        }

        @Test
        @MockUser
        fun `test if secured with non-admin user`() {
            val model = ModelFactory.getCreateUserDto()
            mockMvc
                .post("/v1/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = model.toJSON()
                }.andExpect {
                    status { isForbidden() }
                }
        }

        @Test
        @MockAdmin
        fun `test create user without sending invitation`() {
            val model = ModelFactory.getCreateUserDto(
                name = "Test User",
                email = "testuser@example.com",
                password = "SecurePassword123",
                sendInvitation = false,
                activated = true,
            )
            mockMvc
                .post("/v1/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = model.toJSON()
                }.andExpect {
                    status { isCreated() }
                    content {
                        contentType(MediaType.APPLICATION_JSON)
                        jsonPath("$.id") { exists() }
                        jsonPath("$.name") { value(model.name) }
                        jsonPath("$.email") { value(model.email) }
                        jsonPath("$.role") { value(model.role.name) }
                        jsonPath("$.activated") { value(true) }
                        jsonPath("$.forcePasswordChange") { value(true) }
                    }
                }
        }

        @Test
        @MockAdmin
        fun `test create user with sending invitation`() {
            val model = ModelFactory.getCreateUserDto(
                name = "Invited User",
                email = "invited@example.com",
                password = null,
                sendInvitation = true,
            )
            mockMvc
                .post("/v1/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = model.toJSON()
                }.andExpect {
                    status { isCreated() }
                    content {
                        contentType(MediaType.APPLICATION_JSON)
                        jsonPath("$.id") { exists() }
                        jsonPath("$.name") { value(model.name) }
                        jsonPath("$.email") { value(model.email) }
                        jsonPath("$.activated") { value(true) }
                        jsonPath("$.forcePasswordChange") { value(true) }
                    }
                }
        }

        @Test
        @MockAdmin
        fun `test create user with preset password`() {
            val model = ModelFactory.getCreateUserDto(
                name = "User With Password",
                email = "withpass@example.com",
                password = "MyPassword123",
                sendInvitation = false,
            )
            mockMvc
                .post("/v1/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = model.toJSON()
                }.andExpect {
                    status { isCreated() }
                    content {
                        jsonPath("$.email") { value(model.email) }
                    }
                }
        }

        @Test
        @MockAdmin
        fun `test create user with ADMIN role`() {
            val model = ModelFactory.getCreateUserDto(
                name = "New Admin",
                email = "newadmin@example.com",
                role = SystemRole.ADMIN,
                sendInvitation = false,
            )
            mockMvc
                .post("/v1/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = model.toJSON()
                }.andExpect {
                    status { isCreated() }
                    content {
                        jsonPath("$.role") { value("ADMIN") }
                    }
                }
        }

        @Test
        @MockAdmin
        fun `test create user with USER role`() {
            val model = ModelFactory.getCreateUserDto(
                name = "New User",
                email = "newuser@example.com",
                role = SystemRole.USER,
                sendInvitation = false,
            )
            mockMvc
                .post("/v1/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = model.toJSON()
                }.andExpect {
                    status { isCreated() }
                    content {
                        jsonPath("$.role") { value("USER") }
                    }
                }
        }

        @Test
        @MockAdmin
        fun `test create user creates personal team`() {
            mockMvc
                .post("/v1/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = ModelFactory
                        .getCreateUserDto(
                            name = "User With Team",
                            email = "userteam@example.com",
                            sendInvitation = false,
                        ).toJSON()
                }.andExpect {
                    status { isCreated() }
                }.andReturn()
                .toDto<UserResponse>()
                .id

            val teams = mockMvc
                .get("/v1/team?page=0&size=20")
                .andExpect {
                    status { isOk() }
                }.andReturn()
                .toDto<PaginatedResponse<TeamResponse>>()
                .data

            Assertions.assertThat(teams.map { it.name }.any { it == "User With Team" }).isTrue()
        }

        @Test
        @MockAdmin
        fun `test duplicate email fails validation`() {
            val existingEmail = "existing@example.com"

            // Create first user
            mockMvc
                .post("/v1/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = ModelFactory
                        .getCreateUserDto(
                            email = existingEmail,
                            sendInvitation = false,
                        ).toJSON()
                }.andExpect {
                    status { isCreated() }
                }

            // Try to create second user with same email
            mockMvc
                .post("/v1/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = ModelFactory
                        .getCreateUserDto(
                            email = existingEmail,
                            sendInvitation = false,
                        ).toJSON()
                }.andExpect {
                    status { isBadRequest() }
                    content {
                        jsonPath("$.codeName") { value("USER_EMAIL_ALREADY_TAKEN") }
                    }
                }
        }

        @Test
        @MockAdmin
        fun `test invalid email format`() {
            mockMvc
                .post("/v1/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = ModelFactory
                        .getCreateUserDto(
                            email = "invalid-email",
                            sendInvitation = false,
                        ).toJSON()
                }.andExpect {
                    status { isBadRequest() }
                }
        }

        @Test
        @MockAdmin
        fun `test missing required fields`() {
            mockMvc
                .post("/v1/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = """{}"""
                }.andExpect {
                    status { isBadRequest() }
                }
        }
    }

    @Nested
    @DisplayName("API Put /v1/user")
    inner class UpdateUser {
        @Test
        fun `test if secured`() {
            mockMvc
                .put("/v1/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = ModelFactory.getUpdateUserDto("user1").toJSON()
                }.andExpect {
                    status { isUnauthorized() }
                }
        }

        @Test
        @MockUser
        fun `test if secured with non-admin user`() {
            val model = ModelFactory.getUpdateUserDto("user1")
            mockMvc
                .put("/v1/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = model.toJSON()
                }.andExpect {
                    status { isForbidden() }
                }
        }

        @Test
        @MockAdmin
        fun `test update user not found`() {
            val model = ModelFactory.getUpdateUserDto("nonexistentId")
            mockMvc
                .put("/v1/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = model.toJSON()
                }.andExpect {
                    status { isNotFound() }
                }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test update user name`() {
            val model = ModelFactory.getUpdateUserDto(
                id = "BLyrWbFXSg3K",
                name = "Updated Name",
            )
            mockMvc
                .put("/v1/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = model.toJSON()
                }.andExpect {
                    status { isOk() }
                    content {
                        jsonPath("$.name") { value("Updated Name") }
                    }
                }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test update user email`() {
            val model = ModelFactory.getUpdateUserDto(
                id = "BLyrWbFXSg3K",
                email = "newemail@example.com",
            )
            mockMvc
                .put("/v1/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = model.toJSON()
                }.andExpect {
                    status { isOk() }
                    content {
                        jsonPath("$.email") { value("newemail@example.com") }
                    }
                }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test update user password`() {
            val model = ModelFactory.getUpdateUserDto(
                id = "BLyrWbFXSg3K",
                password = "NewPassword123",
            )
            mockMvc
                .put("/v1/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = model.toJSON()
                }.andExpect {
                    status { isOk() }
                }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test update user role`() {
            val model = ModelFactory.getUpdateUserDto(
                id = "BLyrWbFXSg3K",
                role = SystemRole.ADMIN,
            )
            mockMvc
                .put("/v1/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = model.toJSON()
                }.andExpect {
                    status { isOk() }
                    content {
                        jsonPath("$.role") { value("ADMIN") }
                    }
                }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test activate user`() {
            val model = ModelFactory.getUpdateUserDto(
                id = "BLyrWbFXSg3K",
                activated = true,
            )
            mockMvc
                .put("/v1/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = model.toJSON()
                }.andExpect {
                    status { isOk() }
                    content {
                        jsonPath("$.activated") { value(true) }
                    }
                }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test deactivate user`() {
            val model = ModelFactory.getUpdateUserDto(
                id = "phECfcYSejyt",
                activated = false,
            )
            mockMvc
                .put("/v1/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = model.toJSON()
                }.andExpect {
                    status { isOk() }
                    content {
                        jsonPath("$.activated") { value(false) }
                    }
                }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test update user and send invitation without password`() {
            val model = ModelFactory.getUpdateUserDto(
                id = "BLyrWbFXSg3K",
                name = "Reinvited User",
                sendInvitation = true,
                password = null,
            )
            mockMvc
                .put("/v1/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = model.toJSON()
                }.andExpect {
                    status { isOk() }
                    content {
                        jsonPath("$.name") { value("Reinvited User") }
                        jsonPath("$.activated") { value(true) }
                        jsonPath("$.forcePasswordChange") { value(true) }
                    }
                }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test update user and send invitation with password`() {
            val model = ModelFactory.getUpdateUserDto(
                id = "BLyrWbFXSg3K",
                sendInvitation = true,
                password = "NewInvitePassword123",
            )
            mockMvc
                .put("/v1/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = model.toJSON()
                }.andExpect {
                    status { isOk() }
                    content {
                        jsonPath("$.activated") { value(true) }
                        jsonPath("$.forcePasswordChange") { value(true) }
                    }
                }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test update multiple fields at once`() {
            val model = ModelFactory.getUpdateUserDto(
                id = "BLyrWbFXSg3K",
                name = "Fully Updated User",
                email = "fullyupdated@example.com",
                role = SystemRole.ADMIN,
                activated = true,
                forcePasswordChange = false,
            )
            mockMvc
                .put("/v1/user") {
                    contentType = MediaType.APPLICATION_JSON
                    content = model.toJSON()
                }.andExpect {
                    status { isOk() }
                    content {
                        jsonPath("$.name") { value("Fully Updated User") }
                        jsonPath("$.email") { value("fullyupdated@example.com") }
                        jsonPath("$.role") { value("ADMIN") }
                        jsonPath("$.activated") { value(true) }
                    }
                }
        }
    }

//    @Nested
//    @DisplayName("API Delete /v1/user/{id}")
//    inner class DeleteUser {
//        @Test
//        fun `test if secured`() {
//            mockMvc.delete("/v1/user/user1").andExpect {
//                status { isUnauthorized() }
//            }
//        }
//
//        @Test
//        @MockUser
//        fun `test if secured with non-admin user`() {
//            mockMvc.delete("/v1/user/user1").andExpect {
//                status { isForbidden() }
//            }
//        }
//
//        @Test
//        @MockAdmin
//        fun `test delete user not found`() {
//            mockMvc.delete("/v1/user/nonexistentId").andExpect {
//                status { isNotFound() }
//            }
//        }
//
//        @Test
//        @MockAdmin
//        @ClearInitDatabase
//        fun `test success delete user`() {
//            mockMvc.delete("/v1/user/user2").andExpect {
//                status { isOk() }
//            }
//        }
//
//        @Test
//        @MockAdmin
//        @ClearInitDatabase
//        fun `test deleted user not accessible`() {
//            mockMvc.delete("/v1/user/user2").andExpect {
//                status { isOk() }
//            }
//
//            mockMvc.get("/v1/user/user2").andExpect {
//                status { isNotFound() }
//            }
//        }
//    }
}
