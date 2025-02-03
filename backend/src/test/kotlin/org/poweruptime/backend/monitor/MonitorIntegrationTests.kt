package org.poweruptime.backend.monitor

import org.assertj.core.api.Assertions.assertThat
import org.hamcrest.Matchers.hasItem
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.poweruptime.backend.configuration.toJSON
import org.poweruptime.backend.core.*
import org.poweruptime.backend.core.utils.RandomGenerator
import org.poweruptime.backend.features.instanceSetting.InstanceSettingService
import org.poweruptime.backend.features.monitor.checker.dns.DnsMonitorCheckerData
import org.poweruptime.backend.features.monitor.checker.dns.DnsMonitorCheckerDataType
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorCheckerData
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorCheckerDataContentType
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorCheckerDataMethod
import org.poweruptime.backend.features.monitor.checker.ping.PingMonitorCheckerData
import org.poweruptime.backend.features.monitor.checker.push.PushMonitorCheckerData
import org.poweruptime.backend.features.monitor.checker.ssl.SSLCertificateMonitorCheckerData
import org.poweruptime.backend.features.monitor.dto.MonitorFullResponse
import org.poweruptime.backend.features.team.dto.TeamResponse
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.*

class MonitorIntegrationTests(
    @Autowired val mockMvc: MockMvc,
    @Autowired val instanceSettingService: InstanceSettingService
) : BaseTestWithReusingContainers() {
    private val dnsMonitorCheckerData = DnsMonitorCheckerData(
        host = "playground.dafnik.me",
        server = "9.9.9.9",
        port = 53,
        type = DnsMonitorCheckerDataType.CNAME,
        matches = listOf("dafnik.github.io."),
    )

    private val monitorCheckers = listOf(
        dnsMonitorCheckerData,
        HttpMonitorCheckerData(
            url = "https://expired.badssl.com/",
            method = HttpMonitorCheckerDataMethod.GET,
            contentType = HttpMonitorCheckerDataContentType.JSON,
            ignoreTLS = true,
            body = null,
            searchTerm = null,
            authType = null,
            basicAuthDataUsername = null,
            basicAuthDataPassword = null,
        ),
        PingMonitorCheckerData(
            ip = "1.1.1.1",
            port = 80,
        ),
        PushMonitorCheckerData(
            pushId = RandomGenerator.nanoId(),
        ),
        SSLCertificateMonitorCheckerData(
            url = "https://dafnik.me",
            validDaysLeft = 30,
        ),
    )

    @Nested
    @DisplayName("API Get /v1/monitor")
    inner class GetMonitor {
        @Test
        fun `test if secured`() {
            mockMvc.get("/v1/monitor/k6A6bEK7C9pC").andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser(MockUsers.USER3)
        fun `test if secured with wrong team user`() {
            mockMvc.get("/v1/monitor/k6A6bEK7C9pC").andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockUser
        fun `test if user fail not found`() {
            mockMvc.get("/v1/monitor/abcdef").andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        fun `test if admin fail not found`() {
            mockMvc.get("/v1/monitor/abcefe").andExpect {
                status { isNotFound() }
            }
        }

        @Test
        @MockAdmin
        fun `test success with admin`() {
            mockMvc.get("/v1/monitor/k6A6bEK7C9pC").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    content {
                        jsonPath("$.id") { value("k6A6bEK7C9pC") }
                        jsonPath("$.checker._type") { value("SSL_CERTIFICATE") }
                    }
                }
            }
        }

        @Test
        @MockUser
        fun `test success with team admin user`() {
            mockMvc.get("/v1/monitor/k6A6bEK7C9pC").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    content {
                        jsonPath("$.id") { value("k6A6bEK7C9pC") }
                        jsonPath("$.checker._type") { value("SSL_CERTIFICATE") }
                    }
                }
            }
        }

        @Test
        @MockUser(MockUsers.USER2)
        fun `test success with team user`() {
            mockMvc.get("/v1/monitor/k6A6bEK7C9pC").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    content {
                        jsonPath("$.id") { value("k6A6bEK7C9pC") }
                        jsonPath("$.checker._type") { value("SSL_CERTIFICATE") }
                    }
                }
            }
        }
    }

    @Nested
    @DisplayName("API Get all /v1/monitor")
    inner class GetAllTeams {
        @Test
        fun `test if secured`() {
            mockMvc.get("/v1/monitor").andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser(MockUsers.USER3)
        @ClearInitDatabase
        fun `test if secured by permissions`() {
            mockMvc.get("/v1/monitor?teamId=4Lxhu5YKWPBr&page=0&size=10").andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test if accessible with admin user`() {
            mockMvc.get("/v1/monitor?teamId=4Lxhu5YKWPBr&page=0&size=10").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.data.length()") { value(3) }
                    jsonPath("$.data[0].name") { value("Test SSL Certificate") }
                    jsonPath("$.data[0].team.id") { value("4Lxhu5YKWPBr") }
                    jsonPath("$.data[1].name") { hasItem("Test HTTP") }
                    jsonPath("$.data[1].team.id") { value("4Lxhu5YKWPBr") }
                    jsonPath("$.data[1].oneDayUptime") { value("100%") }
                    jsonPath("$.data[2].name") { hasItem("Test playground CNAME DNS") }
                    jsonPath("$.data[2].team.id") { value("4Lxhu5YKWPBr") }
                }
            }
        }

        @Test
        @MockUser
        @ClearInitDatabase
        fun `test if accessible with team admin`() {
            mockMvc.get("/v1/monitor?teamId=4Lxhu5YKWPBr&page=0&size=10").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.data.length()") { value(3) }
                    jsonPath("$.data[0].name") { value("Test SSL Certificate") }
                    jsonPath("$.data[0].team.id") { value("4Lxhu5YKWPBr") }
                    jsonPath("$.data[1].name") { hasItem("Test HTTP") }
                    jsonPath("$.data[1].team.id") { value("4Lxhu5YKWPBr") }
                    jsonPath("$.data[1].oneDayUptime") { value("100%") }
                    jsonPath("$.data[2].name") { hasItem("Test playground CNAME DNS") }
                    jsonPath("$.data[2].team.id") { value("4Lxhu5YKWPBr") }
                }
            }
        }

        @Test
        @MockUser(MockUsers.USER2)
        @ClearInitDatabase
        fun `test if accessible with team user`() {
            mockMvc.get("/v1/monitor?teamId=4Lxhu5YKWPBr&page=0&size=10").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.data.length()") { value(3) }
                    jsonPath("$.data[0].name") { value("Test SSL Certificate") }
                    jsonPath("$.data[0].team.id") { value("4Lxhu5YKWPBr") }
                    jsonPath("$.data[1].name") { hasItem("Test HTTP") }
                    jsonPath("$.data[1].team.id") { value("4Lxhu5YKWPBr") }
                    jsonPath("$.data[1].oneDayUptime") { value("100%") }
                    jsonPath("$.data[2].name") { hasItem("Test playground CNAME DNS") }
                    jsonPath("$.data[2].team.id") { value("4Lxhu5YKWPBr") }
                }
            }
        }

        @Test
        @MockUser(MockUsers.USER3)
        @ClearInitDatabase
        fun `test if accessible with other team user`() {
            mockMvc.get("/v1/monitor?teamId=wERfKhghD98U&page=0&size=10").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.data.length()") { value(1) }
                    jsonPath("$.data[0].name") { value("Test playground A DNS null matches") }
                    jsonPath("$.data[0].team.id") { value("wERfKhghD98U") }
                    jsonPath("$.data[0].oneDayUptime") { value("100%") }
                }
            }
        }

        @Test
        @MockAdmin
        @ClearInitDatabase
        fun `test if accessible with empty team`() {
            mockMvc.get("/v1/monitor?teamId=5GXzHe8YATsA&page=0&size=10").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$.data.length()") { value(0) }
                }
            }
        }
    }

    @Nested
    @DisplayName("API Post /v1/monitor")
    inner class CreateMonitor {
        @Test
        fun `test if secured`() {
            mockMvc.post("/v1/monitor") {
                contentType = MediaType.APPLICATION_JSON
                content = ModelFactory.getCreateMonitorDto(dnsMonitorCheckerData).toJSON()
            }.andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser
        fun `test success with user`() {
            val model = ModelFactory.getCreateMonitorDto(dnsMonitorCheckerData)
            mockMvc.post("/v1/monitor") {
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
            }.andReturn().toDto(TeamResponse::class.java)

            val monitorModel = ModelFactory.getCreateMonitorDto(
                dnsMonitorCheckerData,
                teamId = teamId,
            )
            mockMvc.post("/v1/monitor") {
                contentType = MediaType.APPLICATION_JSON
                content = monitorModel.toJSON()
            }.andExpect {
                status { isCreated() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    content {
                        jsonPath("$.id") { exists() }
                        jsonPath("$.name") { value(monitorModel.name) }
                    }
                }
            }
        }

        @Test
        @MockAdmin
        fun `test success with admin`() {
            val model = ModelFactory.getCreateMonitorDto(dnsMonitorCheckerData)
            mockMvc.post("/v1/monitor") {
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
            val createdMonitors = monitorCheckers.map {
                val model = ModelFactory.getCreateMonitorDto(it)
                val monitor = mockMvc.post("/v1/monitor") {
                    contentType = MediaType.APPLICATION_JSON
                    content = model.toJSON()
                }.andExpect {
                    status { isCreated() }
                    content {
                        contentType(MediaType.APPLICATION_JSON)
                        content {
                            jsonPath("$.id") { exists() }
                            jsonPath("$.name") { value(model.name) }
                            jsonPath("$.team.id") { value("4Lxhu5YKWPBr") }
                            jsonPath("$.checker._type") { value(it._type.code) }
                        }
                    }
                }.andReturn().toDto(MonitorFullResponse::class.java)

                assertThat(monitor.checker.toJSON()).isEqualTo(it.toJSON())

                monitor.id
            }

            // Test updating
            createdMonitors.forEach {
                val model = ModelFactory.getUpdateMonitorDto(it, monitorCheckers.random())
                val monitor = mockMvc.put("/v1/monitor") {
                    contentType = MediaType.APPLICATION_JSON
                    content = model.toJSON()
                }.andExpect {
                    status { isOk() }
                    content {
                        contentType(MediaType.APPLICATION_JSON)
                        content {
                            jsonPath("$.id") { value(it) }
                            jsonPath("$.name") { value(model.name) }
                            jsonPath("$.team.id") { value("4Lxhu5YKWPBr") }
                            jsonPath("$.checker._type") { value(model.checker._type.code) }
                        }
                    }
                }.andReturn().toDto(MonitorFullResponse::class.java)

                assertThat(monitor.checker.toJSON()).isEqualTo(model.checker.toJSON())
            }
        }
    }

    @Nested
    @DisplayName("API Put /v1/monitor")
    inner class UpdateMonitor {
        @Test
        fun `test if secured`() {
            mockMvc.put("/v1/monitor") {
                contentType = MediaType.APPLICATION_JSON
                content = ModelFactory.getUpdateMonitorDto("6XSKoPbRhSsb", dnsMonitorCheckerData).toJSON()
            }.andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockUser(MockUsers.USER2)
        fun `test if secured with team user`() {
            val model = ModelFactory.getUpdateMonitorDto("6XSKoPbRhSsb", dnsMonitorCheckerData)
            mockMvc.put("/v1/monitor") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockUser(MockUsers.USER3)
        fun `test if secured with wrong team user`() {
            val model = ModelFactory.getUpdateMonitorDto("6XSKoPbRhSsb", dnsMonitorCheckerData)
            mockMvc.put("/v1/monitor") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        fun `test success with admin`() {
            val model = ModelFactory.getUpdateMonitorDto("6XSKoPbRhSsb", dnsMonitorCheckerData)
            mockMvc.put("/v1/monitor") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    content {
                        jsonPath("$.id") { value("6XSKoPbRhSsb") }
                        jsonPath("$.name") { value(model.name) }
                    }
                }
            }
        }

        @Test
        @MockUser
        fun `test success with team admin user`() {
            val model = ModelFactory.getUpdateMonitorDto("6XSKoPbRhSsb", dnsMonitorCheckerData)
            mockMvc.put("/v1/monitor") {
                contentType = MediaType.APPLICATION_JSON
                content = model.toJSON()
            }.andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    content {
                        jsonPath("$.id") { value("6XSKoPbRhSsb") }
                        jsonPath("$.name") { value(model.name) }
                    }
                }
            }
        }
    }

    @Nested
    @DisplayName("API Delete /v1/monitor")
    inner class DeleteMonitor {
        @Test
        fun `test if secured`() {
            mockMvc.delete("/v1/monitor/k6A6bEK7C9pC").andExpect {
                status { isUnauthorized() }
            }
        }

        @Test
        @MockAdmin
        fun `test if admin fail not found`() {
            mockMvc.delete("/v1/monitor/abcdefbh").andExpect {
                status { isNotFound() }
            }
        }

        @Test
        @MockUser
        fun `test if user fail not found`() {
            mockMvc.delete("/v1/monitor/abcdefbh").andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockUser(MockUsers.USER2)
        fun `test secured with team user`() {
            mockMvc.delete("/v1/monitor/k6A6bEK7C9pC").andExpect {
                status { isForbidden() }
            }
        }

        @Test
        @MockAdmin
        fun `test success with admin`() {
            mockMvc.delete("/v1/monitor/pbP9gekfhG44").andExpect {
                status { isOk() }
            }
        }

        @Test
        @MockUser
        fun `test success with team admin`() {
            mockMvc.delete("/v1/monitor/rKALbBX37kWr").andExpect {
                status { isOk() }
            }
        }
    }
}
