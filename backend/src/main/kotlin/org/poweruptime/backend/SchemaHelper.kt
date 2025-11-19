package org.poweruptime.backend

import io.github.oshai.kotlinlogging.KotlinLogging
import org.jetbrains.exposed.v1.jdbc.SchemaUtils
import org.jetbrains.exposed.v1.jdbc.exists
import org.poweruptime.backend.core.utils.Config
import org.poweruptime.backend.features.authentication.model.MFABackupCodeTable
import org.poweruptime.backend.features.authentication.model.MFATable
import org.poweruptime.backend.features.authentication.model.PasswordResetTokenTable
import org.poweruptime.backend.features.authentication.model.RefreshTokenTable
import org.poweruptime.backend.features.authentication.model.SessionTable
import org.poweruptime.backend.features.authentication.model.UserTable
import org.poweruptime.backend.features.deadLetter.DeadLetterTable
import org.poweruptime.backend.features.fileUpload.FileTable
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
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

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
