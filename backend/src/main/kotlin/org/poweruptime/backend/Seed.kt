package org.poweruptime.backend

import io.github.oshai.kotlinlogging.KotlinLogging
import org.jetbrains.exposed.v1.jdbc.batchInsert
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.poweruptime.backend.features.mail.EmailSecurity
import org.poweruptime.backend.features.monitor.checker.dns.DnsMonitorDataRecord
import org.poweruptime.backend.features.monitor.checker.dns.DnsMonitorDataType
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorDataContentType
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorDataMethod
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorDataRecord
import org.poweruptime.backend.features.monitor.checker.ssl.SSLCertificateMonitorDataRecord
import org.poweruptime.backend.features.monitor.dto.CreateMonitorDto
import org.poweruptime.backend.features.monitor.model.CheckResultTable
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.service.MonitorService
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.dto.CreateNotificationMethodDto
import org.poweruptime.backend.features.notification.model.NotificationMethodTable
import org.poweruptime.backend.features.notification.model.rowToNotificationMethodRecord
import org.poweruptime.backend.features.notification.notificationMethods.email.EmailNotificationMethodDataRecord
import org.poweruptime.backend.features.notification.notificationMethods.email.EmailNotificationMethodDataTable
import org.poweruptime.backend.features.notification.service.NotificationMethodService
import org.poweruptime.backend.features.team.dto.CreateTeamDto
import org.poweruptime.backend.features.team.model.TeamTable
import org.poweruptime.backend.features.team.service.TeamService
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import kotlin.system.exitProcess

@Configuration
class Seed(
    private val teamService: TeamService,
    private val monitorService: MonitorService,
    private val notificationMethodService: NotificationMethodService,
    private val checkResultSeedService: CheckResultSeedService,
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

        if (false) {
            statusCodes.map { statusCode ->
                monitorService.create(
                    CreateMonitorDto(
                        teamId = httpTestTeam.publicId,
                        name = "HTTP Status $statusCode",
                        data = HttpMonitorDataRecord(
                            url = "https://httpstat.us/$statusCode",
                            method = HttpMonitorDataMethod.GET,
                            contentType = HttpMonitorDataContentType.JSON,
                            allowedStatusCodeRanges = listOf("$statusCode - $statusCode"),
                        ),
                        testIntervalSeconds = 3600,
                        upsideDown = false,
                        description = null,
                        retries = null,
                        resendAfter = null,
                        notificationMethodIds = listOf(),
                        tags = listOf(),
                    ),
                )
            }
        }

        monitorService.create(
            CreateMonitorDto(
                teamId = httpTestTeam.publicId,
                name = "BadSSL Expired Test",
                data = HttpMonitorDataRecord(
                    url = "https://expired.badssl.com/",
                    method = HttpMonitorDataMethod.GET,
                    contentType = HttpMonitorDataContentType.JSON,
                    allowedStatusCodeRanges = listOf("200 - 299"),
                    ignoreTLS = true,
                ),
                testIntervalSeconds = 3600,
                upsideDown = false,
                description = null,
                retries = null,
                resendAfter = null,
                notificationMethodIds = listOf(),
                tags = listOf(),
            ),
        )

        val testTeam = teamService.create(CreateTeamDto(name = "Monitor Test Team"))

        transaction {
            TeamTable.batchInsert(
                (0..200),
            ) { index ->
                this[TeamTable.name] = "Test Team $index"
            }
        }

        val emailNotificationMethod = notificationMethodService.create(
            CreateNotificationMethodDto(
                name = "Test EMAIL",
                data = EmailNotificationMethodDataRecord(
                    to = setOf("test@test.at"),
                    host = "test.at",
                    port = 1234,
                    username = "test",
                    password = "test",
                    security = EmailSecurity.NONE_STARTTLS,
                    ignoreTLSErrors = true,
                    cc = null,
                    bcc = null,
                ),
                teamId = testTeam.publicId,
                useByDefault = false,
                monitorIds = listOf(),
                testSend = false,
                titleTemplate = null,
                bodyTemplate = null,
            ),
        )

        val methods = transaction {
            NotificationMethodTable.batchInsert((0..200)) { index ->
                this[NotificationMethodTable.name] = "Z Autogenerated $index"
                this[NotificationMethodTable.teamId] = testTeam.id
                this[NotificationMethodTable.type] = NotificationMethodType.EMAIL
            }.map {
                NotificationMethodTable.rowToNotificationMethodRecord(it)
            }
        }

        transaction {
            EmailNotificationMethodDataTable.batchInsert(methods) { method ->
                this[EmailNotificationMethodDataTable.id] = method.id
                this[EmailNotificationMethodDataTable.to] = arrayListOf("test@test.at")
                this[EmailNotificationMethodDataTable.host] = "test.at"
                this[EmailNotificationMethodDataTable.port] = 1234
                this[EmailNotificationMethodDataTable.username] = "test"
                this[EmailNotificationMethodDataTable.password] = "test"
                this[EmailNotificationMethodDataTable.security] = EmailSecurity.NONE_STARTTLS
                this[EmailNotificationMethodDataTable.ignoreTLSErrors] = true
            }
        }

        monitorService.create(
            CreateMonitorDto(
                teamId = testTeam.publicId,
                name = "Test HTTP",
                description = "Test",
                data = HttpMonitorDataRecord(
                    url = "https://dafnik.me",
                    method = HttpMonitorDataMethod.GET,
                    contentType = HttpMonitorDataContentType.JSON,
                    allowedStatusCodeRanges = listOf("200 - 299"),
                    maxRedirects = 10,
                ),
                testIntervalSeconds = 120,
                upsideDown = false,
                notificationMethodIds = listOf(emailNotificationMethod.notificationMethod.publicId),
                retries = null,
                resendAfter = null,
                tags = listOf(),
            ),
        ).let {
            checkResultSeedService.seedCheckResultForMonitor(it.monitor.id, 700_000)
        }

        monitorService.create(
            CreateMonitorDto(
                teamId = testTeam.publicId,
                name = "Test SSL Certificate",
                description = "Test",
                data = SSLCertificateMonitorDataRecord(
                    url = "https://dafnik.me",
                    validDaysLeft = 30,
                ),
                testIntervalSeconds = 120,
                upsideDown = false,
                notificationMethodIds = listOf(emailNotificationMethod.notificationMethod.publicId),
                retries = null,
                resendAfter = null,
                tags = listOf(),
            ),
        ).let {
            checkResultSeedService.seedCheckResultForMonitor(it.monitor.id, 700_000)
        }

        monitorService.create(
            CreateMonitorDto(
                teamId = testTeam.publicId,
                name = "Test playground DNS",
                description = "Test",
                data = DnsMonitorDataRecord(
                    host = "playground.dafnik.me",
                    server = "9.9.9.9",
                    port = 53,
                    type = DnsMonitorDataType.A,
                    matches = listOf(
                        "185.199.109.153",
                        "185.199.110.153",
                        "185.199.111.153",
                        "185.199.108.153",
                    ),
                ),
                testIntervalSeconds = 86400,
                upsideDown = false,
                retries = null,
                resendAfter = null,
                notificationMethodIds = listOf(),
                tags = listOf(),
            ),
        ).let {
            checkResultSeedService.seedCheckResultForMonitor(it.monitor.id, 700_000)
        }

        monitorService.create(
            CreateMonitorDto(
                teamId = testTeam.publicId,
                name = "Test playground CNAME DNS",
                description = "Test",
                data = DnsMonitorDataRecord(
                    host = "playground.dafnik.me",
                    server = "9.9.9.9",
                    port = 53,
                    type = DnsMonitorDataType.CNAME,
                    matches = listOf("dafnik.github.io."),
                ),
                testIntervalSeconds = 60,
                upsideDown = false,
                retries = 2,
                resendAfter = null,
                notificationMethodIds = listOf(),
                tags = listOf(),
            ),
        ).let {
            checkResultSeedService.seedCheckResultForMonitor(it.monitor.id, 700_000)
        }

        monitorService.create(
            CreateMonitorDto(
                teamId = testTeam.publicId,
                name = "Test playground A DNS null matches",
                description = "Test",
                data = DnsMonitorDataRecord(
                    host = "playground.dafnik.me",
                    server = "9.9.9.9",
                    port = 53,
                    type = DnsMonitorDataType.A,
                    matches = null,
                ),
                testIntervalSeconds = 60,
                upsideDown = false,
                retries = 2,
                resendAfter = null,
                notificationMethodIds = listOf(),
                tags = listOf(),
            ),
        ).let {
            checkResultSeedService.seedCheckResultForMonitor(it.monitor.id, 700_000)
        }

        // shut down the app once seeding is done
        exitProcess(0)
    }
}

@Service
class CheckResultSeedService {
    private final val logger = KotlinLogging.logger {}

    @Transactional
    fun seedCheckResultForMonitor(monitorId: ULong, length: Long) {
        val now = Instant.now()

        logger.info { "Creating check results for $monitorId" }

        for (chunk in (1..length).chunked(100)) {
            logger.info { "Starting chunk ${chunk.first()} - ${chunk.last()}" }
            insert(now, monitorId, chunk)
        }
    }

    fun insert(now: Instant, monitorId: ULong, ids: List<Long>) {
        CheckResultTable.batchInsert(ids) {
            val relative = now.plusSeconds(it * 60)

            this[CheckResultTable.monitorId] = monitorId
            this[CheckResultTable.status] = MonitorStatus.UP
            this[CheckResultTable.timesRetried] = 0
            this[CheckResultTable.previousStatus] = MonitorStatus.UP
            this[CheckResultTable.pickedUpAt] = relative
            this[CheckResultTable.checkedAt] = relative.plusSeconds(10)
            this[CheckResultTable.pingMs] = 69
            this[CheckResultTable.title] = "Test - OK"
            this[CheckResultTable.message] = "Test - OK"
        }
    }
}
