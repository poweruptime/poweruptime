package org.poweruptime.backend

import io.github.oshai.kotlinlogging.KotlinLogging
import org.jetbrains.exposed.v1.jdbc.SchemaUtils
import org.jetbrains.exposed.v1.jdbc.exists
import org.poweruptime.backend.core.utils.Config
import org.poweruptime.backend.core.utils.DateTimeUtils
import org.poweruptime.backend.features.authentication.model.MFABackupCodeTable
import org.poweruptime.backend.features.authentication.model.MFATable
import org.poweruptime.backend.features.authentication.model.PasswordResetTokenTable
import org.poweruptime.backend.features.authentication.model.RefreshTokenTable
import org.poweruptime.backend.features.authentication.model.SessionTable
import org.poweruptime.backend.features.authentication.model.UserTable
import org.poweruptime.backend.features.deadLetter.DeadLetterTable
import org.poweruptime.backend.features.fileUpload.FileService
import org.poweruptime.backend.features.fileUpload.FileTable
import org.poweruptime.backend.features.info.InfoService
import org.poweruptime.backend.features.info.instanceSetting.InstanceSettingService
import org.poweruptime.backend.features.info.instanceSetting.InstanceSettingTable
import org.poweruptime.backend.features.info.versionChecker.VersionCheckMailTable
import org.poweruptime.backend.features.monitor.checker.dns.DnsMonitorDataTable
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorDataTable
import org.poweruptime.backend.features.monitor.checker.ping.PingMonitorDataTable
import org.poweruptime.backend.features.monitor.checker.push.PushMonitorCheckerEntryTable
import org.poweruptime.backend.features.monitor.checker.push.PushMonitorDataTable
import org.poweruptime.backend.features.monitor.checker.ssl.SSLCertificateMonitorDataTable
import org.poweruptime.backend.features.monitor.model.CheckResultLogEntryTable
import org.poweruptime.backend.features.monitor.model.CheckResultTable
import org.poweruptime.backend.features.monitor.model.HistoricalDayUptimeTable
import org.poweruptime.backend.features.monitor.model.MonitorTable
import org.poweruptime.backend.features.monitor.service.MonitorService
import org.poweruptime.backend.features.notification.model.MonitorNotificationMethodTable
import org.poweruptime.backend.features.notification.model.NotificationMethodTable
import org.poweruptime.backend.features.notification.model.NotificationTable
import org.poweruptime.backend.features.notification.model.SubNotificationTable
import org.poweruptime.backend.features.notification.notificationMethods.apprise.AppriseNotificationMethodDataTable
import org.poweruptime.backend.features.notification.notificationMethods.discord.DiscordNotificationMethodDataTable
import org.poweruptime.backend.features.notification.notificationMethods.email.EmailNotificationMethodDataTable
import org.poweruptime.backend.features.notification.notificationMethods.slack.SlackNotificationMethodDataTable
import org.poweruptime.backend.features.profile.EmailChangeTokenTable
import org.poweruptime.backend.features.statusPage.model.StatusPageDomainNameTable
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupMonitorTable
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupTable
import org.poweruptime.backend.features.statusPage.model.StatusPageTable
import org.poweruptime.backend.features.tag.MonitorTagTable
import org.poweruptime.backend.features.tag.TagTable
import org.poweruptime.backend.features.team.model.TeamJoinTokenTable
import org.poweruptime.backend.features.team.model.TeamSettingTable
import org.poweruptime.backend.features.team.model.TeamTable
import org.poweruptime.backend.features.team.model.TeamUserTable
import org.poweruptime.backend.features.tempNotification.TempNotification
import org.poweruptime.backend.features.tempNotification.TempNotificationService
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.ApplicationListener
import org.springframework.context.event.ContextRefreshedEvent
import org.springframework.stereotype.Component
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.ZoneId

@Component
class StartupApplicationListener(
    private val tempNotificationService: TempNotificationService,
    private val monitorService: MonitorService,
    private val infoService: InfoService,
    private val fileService: FileService,
    private val instanceSettingService: InstanceSettingService,
    private val schemaHelper: SchemaHelper,
    @Value(Config.NOTIFICATION_TEMP_ENABLED) private val tempNotificationsEnabled: Boolean = false,
    @Value(Config.MONITOR_AUTOSTART_ENABLED) private val monitorAutostartEnabled: Boolean = true,
) : ApplicationListener<ContextRefreshedEvent> {

    private final val logger = KotlinLogging.logger {}

    override fun onApplicationEvent(event: ContextRefreshedEvent) {
        logger.info {
            "Server setup time: ${DateTimeUtils.simpleDateTimeFormatter.format(
                instanceSettingService.getServerSetupTime().atZone(ZoneId.systemDefault()),
            )}"
        }

        schemaHelper.execute()

        fileService.init()
        setupTempNotification()

        logger.info { "Monitor autostart enabled: $monitorAutostartEnabled" }
        if (monitorAutostartEnabled) {
            monitorService.startAll()
        }
    }

    private fun setupTempNotification() {
        fun addTempNotification() {
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

        logger.info { "Temp notifications enabled: $tempNotificationsEnabled" }
        if (tempNotificationsEnabled) {
            addTempNotification()
        }
    }
}

private const val TWO_DAYS_IN_SECONDS = (2 * 24 * 60 * 60).toLong()

@Service
@Transactional
class SchemaHelper(
    @Value(Config.DATABASE_DDL_AUTO) private val databaseDDLAuto: String = "validate",
) {
    private final val logger = KotlinLogging.logger {}

    fun execute() {
        when (databaseDDLAuto) {
            "validate" -> validate()
            "create" -> createDatabase()
        }
    }

    private fun validate() {
        logger.info { "Validating database" }

        val missingTables = tables.filter { !it.exists() }
        if (missingTables.isNotEmpty()) {
            logger.error { "Missing tables in database: ${missingTables.joinToString()}" }
        }

        SchemaUtils.checkExcessiveIndices(*tables.toTypedArray(), withLogs = true)
        SchemaUtils.checkExcessiveForeignKeyConstraints(*tables.toTypedArray(), withLogs = true)
    }

    private fun createDatabase() {
        logger.info { "Creating database" }
        SchemaUtils.create(*tables.toTypedArray())
    }

    private final val tables = listOf(
        DeadLetterTable,
        FileTable,
        InstanceSettingTable,
        VersionCheckMailTable,
        MFATable,
        UserTable,
        TeamTable,
        MonitorTable,
        DnsMonitorDataTable,
        HttpMonitorDataTable,
        PingMonitorDataTable,
        PushMonitorDataTable,
        SSLCertificateMonitorDataTable,
        PushMonitorCheckerEntryTable,
        AppriseNotificationMethodDataTable,
        DiscordNotificationMethodDataTable,
        EmailNotificationMethodDataTable,
        SlackNotificationMethodDataTable,
        MFABackupCodeTable,
        CheckResultTable,
        CheckResultLogEntryTable,
        HistoricalDayUptimeTable,
        NotificationTable,
        NotificationMethodTable,
        MonitorNotificationMethodTable,
        StatusPageTable,
        StatusPageDomainNameTable,
        StatusPageGroupTable,
        StatusPageGroupMonitorTable,
        SubNotificationTable,
        TagTable,
        MonitorTagTable,
        TeamSettingTable,
        EmailChangeTokenTable,
        PasswordResetTokenTable,
        SessionTable,
        RefreshTokenTable,
        TeamJoinTokenTable,
        TeamUserTable,
    )
}
