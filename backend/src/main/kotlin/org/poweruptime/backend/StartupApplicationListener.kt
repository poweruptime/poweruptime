package org.poweruptime.backend

import org.poweruptime.backend.core.utils.Config
import org.poweruptime.backend.features.authentication.model.SystemRole
import org.poweruptime.backend.features.fileUpload.FileService
import org.poweruptime.backend.features.info.InfoService
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
import org.poweruptime.backend.features.tempNotification.TempNotification
import org.poweruptime.backend.features.tempNotification.TempNotificationService
import org.poweruptime.backend.features.user.dto.CreateUserDto
import org.poweruptime.backend.features.user.service.UserService
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.ApplicationListener
import org.springframework.context.event.ContextRefreshedEvent
import org.springframework.stereotype.Component
import java.time.Instant

@Component
class StartupApplicationListener(
    private val userService: UserService,
    private val tempNotificationService: TempNotificationService,
    private val monitorService: MonitorService,
    private val monitorCheckerDataService: MonitorCheckerDataService,
    private val teamService: TeamService,
    private val notificationMethodService: NotificationMethodService,
    private val notificationSenderDataService: NotificationSenderDataService,
    private val infoService: InfoService,
    private val fileService: FileService,
    @Value(Config.NOTIFICATION_TEMP_ENABLED) private val tempNotificationsEnabled: Boolean = false,
) : ApplicationListener<ContextRefreshedEvent> {

    private val log: Logger = LoggerFactory.getLogger(StartupApplicationListener::class.java)

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

    @Suppress("MaxLineLength", "LongMethod")
    override fun onApplicationEvent(event: ContextRefreshedEvent) {
        addFirstAdminUserIfNotExists()
        initStorage()
        setupTempNotification()

        startMonitoring()
        return

        if (false) {
            val team = teamService.create(CreateTeamDto(name = "HTTP Monitor Test Team"))

            monitorService.saveAll(
                statusCodes.map { statusCode ->
                    Monitor(
                        team = team,
                        name = "HTTP Status $statusCode",
                        checker = monitorCheckerDataService.save(
                            HttpMonitorCheckerData(
                                url = "https://httpstat.us/$statusCode",
                                method = HttpMonitorCheckerDataMethod.GET,
                                contentType = HttpMonitorCheckerDataContentType.JSON,
                                ignoreTLS = false,
                                body = null,
                                searchTerm = null,
                                authType = null,
                                basicAuthDataUsername = null,
                                basicAuthDataPassword = null,
                            ),
                        ),
                        testIntervalSeconds = 3600,
                        upsideDown = false,
                        retries = 0,
                    )
                },
            )

            monitorService.save(
                Monitor(
                    team = team,
                    name = "BadSSL Expired Test",
                    description = "Test",
                    checker = monitorCheckerDataService.save(
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
                    ),
                    testIntervalSeconds = 120,
                    upsideDown = false,
                    retries = 0,
                ),
            )
        }

        val team = teamService.create(CreateTeamDto(name = "Monitor Test Team"))

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
                team = team,
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
                    team = team,
                )
            },
        )

        monitorService.save(
            Monitor(
                team = team,
                name = "Test HTTP",
                description = "Test",
                checker = monitorCheckerDataService.save(
                    HttpMonitorCheckerData(
                        url = "https://dafnik.me",
                        method = HttpMonitorCheckerDataMethod.GET,
                        contentType = HttpMonitorCheckerDataContentType.JSON,
                        ignoreTLS = false,
                        body = null,
                        searchTerm = null,
                        authType = null,
                        basicAuthDataUsername = null,
                        basicAuthDataPassword = null,
                    ),
                ),
                // data = """{"host":"dafnik.me","server":"9.9.9.9","port":53,"type":"A"}""",
                testIntervalSeconds = 120,
                upsideDown = false,
                retries = 0,
                enabledNotificationMethods = listOf(emailNotificationMethod),
            ),
        )

        monitorService.save(
            Monitor(
                team = team,
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
                retries = 0,
                enabledNotificationMethods = listOf(emailNotificationMethod),
            ),
        )

//        repeat(200) {
//            monitorService.save(
//                Monitor(
//                    team = team,
//                    name = "Test playground DNS",
//                    description = "Test",
//                    checker = monitorCheckerService.save(
//                        DnsMonitorChecker(
//                            host = "playground.dafnik.me",
//                            server = "9.9.9.9",
//                            port = 53,
//                            type = DnsMonitorCheckerType.A,
//                            matches = listOf(
//                                "185.199.109.153",
//                                "185.199.110.153",
//                                "185.199.111.153",
//                                "185.199.108.153",
//                            ),
//                        ),
//                    ),
//                    testIntervalSeconds = 86400,
//                    upsideDown = false,
//                    retries = 0,
//                ),
//            )
//        }

        monitorService.save(
            Monitor(
                team = team,
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
                team = team,
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

        startMonitoring()
    }

    private fun startMonitoring() = monitorService.startAll()

    private fun initStorage() = fileService.init()

    /**
     * Adds admin user if there is none
     */
    private fun addFirstAdminUserIfNotExists() {
        if (!userService.minOneUserWithRoleExists(SystemRole.ADMIN)) {
            userService.create(
                dto = CreateUserDto(
                    name = "admin",
                    email = "admin@admin.org",
                    password = "Password1234",
                    role = SystemRole.ADMIN,
                    sendInvitation = false,
                    activated = true,
                ),
            )
            log.info("Added first admin user!")
        }
    }

    private fun setupTempNotification() {
        log.info("Temp tempNotification enabled: $tempNotificationsEnabled")
        if (tempNotificationsEnabled) {
            addTempNotification()
        }
    }

    private fun addTempNotification() {
        for (i in 1..3) {
            tempNotificationService.addNotification(
                TempNotification(
                    to = "INFORMATION",
                    subject = "Autogenerated Test $i",
                    body = "Welcome! Running ${infoService.name}! ( ͡° ͜ʖ ͡°) Version: " +
                        "${infoService.version} Build time: ${infoService.buildTime}",
                    bodyHTML = "Welcome! Running ${infoService.name}! ( ͡° ͜ʖ ͡°) <br>" +
                        "Version: ${infoService.version} <br> Build time: ${infoService.buildTime}",
                    createdAt = Instant.now().plusSeconds(TWO_DAYS_IN_SECONDS),
                ),
            )
        }
    }
}

const val TWO_DAYS_IN_SECONDS = (2 * 24 * 60 * 60).toLong()
