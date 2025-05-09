package org.poweruptime.backend

import org.poweruptime.backend.features.mail.EmailSecurity
import org.poweruptime.backend.features.monitor.checker.dns.DnsMonitorCheckerData
import org.poweruptime.backend.features.monitor.checker.dns.DnsMonitorCheckerDataType
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorCheckerData
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorCheckerDataContentType
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorCheckerDataMethod
import org.poweruptime.backend.features.monitor.checker.ssl.SSLCertificateMonitorCheckerData
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.service.MonitorCheckerDataService
import org.poweruptime.backend.features.monitor.service.MonitorService
import org.poweruptime.backend.features.notification.model.NotificationMethod
import org.poweruptime.backend.features.notification.notificationSenders.email.EmailNotificationSenderData
import org.poweruptime.backend.features.notification.service.NotificationMethodService
import org.poweruptime.backend.features.notification.service.NotificationSenderDataService
import org.poweruptime.backend.features.team.dto.CreateTeamDto
import org.poweruptime.backend.features.team.model.Team
import org.poweruptime.backend.features.team.service.TeamService
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile
import kotlin.system.exitProcess

@Configuration
class Seed(
    private val teamService: TeamService,
    private val monitorService: MonitorService,
    private val monitorCheckerDataService: MonitorCheckerDataService,
    private val notificationMethodService: NotificationMethodService,
    private val notificationSenderDataService: NotificationSenderDataService,
) {
    private val statusCodes = listOf(
        100, 101, 102, 103,
        200, 201, 202, 203, 204, 205, 206, 207, 208, 226,
        300, 301, 302, 303, 304, 305, 306, 307, 308,
        400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418,
        421, 422, 423, 424, 425, 426, 428, 429, 431, 451,
        500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511,
        419, 420, 440, 444, 449, 450, 460, 463, 494, 495, 496, 497, 498, 499,
        520, 521, 522, 523, 524, 525, 526, 527, 530, 561,
    )

    @Suppress("LongMethod")
    @Bean
    @Profile("seed")
    fun seedDatabase(): CommandLineRunner = CommandLineRunner {
        val httpTestTeam = teamService.create(CreateTeamDto(name = "HTTP Monitor Test Team"))

        monitorService.saveAll(
            statusCodes.map { statusCode ->
                Monitor(
                    team = httpTestTeam,
                    name = "HTTP Status $statusCode",
                    checker = monitorCheckerDataService.save(
                        HttpMonitorCheckerData(
                            url = "https://httpstat.us/$statusCode",
                            method = HttpMonitorCheckerDataMethod.GET,
                            contentType = HttpMonitorCheckerDataContentType.JSON,
                            allowedStatusCodeRanges = listOf("$statusCode - $statusCode"),
                        ),
                    ),
                    testIntervalSeconds = 3600,
                    upsideDown = false,
                )
            },
        )

        monitorService.save(
            Monitor(
                team = httpTestTeam,
                name = "BadSSL Expired Test",
                description = "Test",
                checker = monitorCheckerDataService.save(
                    HttpMonitorCheckerData(
                        url = "https://expired.badssl.com/",
                        method = HttpMonitorCheckerDataMethod.GET,
                        contentType = HttpMonitorCheckerDataContentType.JSON,
                        allowedStatusCodeRanges = listOf("200 - 299"),
                        ignoreTLS = true,
                    ),
                ),
                testIntervalSeconds = 120,
                upsideDown = false,
            ),
        )

        val testTeam = teamService.create(CreateTeamDto(name = "Monitor Test Team"))

        teamService.saveAll(
            (0..200).map {
                Team(name = "Test Team $it")
            },
        )

        val emailNotificationMethod = notificationMethodService.save(
            NotificationMethod(
                name = "Test EMAIL",
                sender = notificationSenderDataService.save(
                    EmailNotificationSenderData(
                        to = setOf("test@test.at"),
                        host = "test.at",
                        port = 1234,
                        username = "test",
                        password = "test",
                        security = EmailSecurity.NONE_STARTTLS,
                        ignoreTLSErrors = true,
                    ),
                ),
                team = testTeam,
            ),
        )

        notificationMethodService.saveAll(
            (0..200).map {
                NotificationMethod(
                    name = "Z Autogeneriert $it",
                    sender = notificationSenderDataService.save(
                        EmailNotificationSenderData(
                            to = setOf("test@test.at"),
                            host = "test.at",
                            port = 1234,
                            username = "test",
                            password = "test",
                            security = EmailSecurity.NONE_STARTTLS,
                            ignoreTLSErrors = true,
                        ),
                    ),
                    team = testTeam,
                )
            },
        )

        monitorService.save(
            Monitor(
                team = testTeam,
                name = "Test HTTP",
                description = "Test",
                checker = monitorCheckerDataService.save(
                    HttpMonitorCheckerData(
                        url = "https://dafnik.me",
                        method = HttpMonitorCheckerDataMethod.GET,
                        contentType = HttpMonitorCheckerDataContentType.JSON,
                        allowedStatusCodeRanges = listOf("200 - 299"),
                        maxRedirects = 10,
                    ),
                ),
                // data = """{"host":"dafnik.me","server":"9.9.9.9","port":53,"type":"A"}""",
                testIntervalSeconds = 120,
                upsideDown = false,
                enabledNotificationMethods = listOf(emailNotificationMethod),
            ),
        )

        monitorService.save(
            Monitor(
                team = testTeam,
                name = "Test SSL Certificate",
                description = "Test",
                checker = monitorCheckerDataService.save(
                    SSLCertificateMonitorCheckerData(
                        url = "https://dafnik.me",
                        validDaysLeft = 30,
                    ),
                ),
                testIntervalSeconds = 120,
                upsideDown = false,
                enabledNotificationMethods = listOf(emailNotificationMethod),
            ),
        )

        monitorService.save(
            Monitor(
                team = testTeam,
                name = "Test playground DNS",
                description = "Test",
                checker = monitorCheckerDataService.save(
                    DnsMonitorCheckerData(
                        host = "playground.dafnik.me",
                        server = "9.9.9.9",
                        port = 53,
                        type = DnsMonitorCheckerDataType.A,
                        matches = listOf(
                            "185.199.109.153",
                            "185.199.110.153",
                            "185.199.111.153",
                            "185.199.108.153",
                        ),
                    ),
                ),
                testIntervalSeconds = 86400,
                upsideDown = false,
            ),
        )

        monitorService.save(
            Monitor(
                team = testTeam,
                name = "Test playground CNAME DNS",
                description = "Test",
                checker = monitorCheckerDataService.save(
                    DnsMonitorCheckerData(
                        host = "playground.dafnik.me",
                        server = "9.9.9.9",
                        port = 53,
                        type = DnsMonitorCheckerDataType.CNAME,
                        matches = listOf("dafnik.github.io."),
                    ),
                ),
                testIntervalSeconds = 60,
                upsideDown = false,
                retries = 2,
            ),
        )

        monitorService.save(
            Monitor(
                team = testTeam,
                name = "Test playground A DNS null matches",
                description = "Test",
                checker = monitorCheckerDataService.save(
                    DnsMonitorCheckerData(
                        host = "playground.dafnik.me",
                        server = "9.9.9.9",
                        port = 53,
                        type = DnsMonitorCheckerDataType.A,
                        matches = null,
                    ),
                ),
                testIntervalSeconds = 60,
                upsideDown = false,
                retries = 2,
            ),
        )

        // shut down the app once seeding is done
        exitProcess(0)
    }
}
