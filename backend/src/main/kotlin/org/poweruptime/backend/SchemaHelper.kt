package org.poweruptime.backend

import io.github.oshai.kotlinlogging.KotlinLogging
import org.jetbrains.exposed.v1.jdbc.SchemaUtils
import org.jetbrains.exposed.v1.jdbc.exists
import org.poweruptime.backend.core.utils.Config
import org.poweruptime.backend.features.authentication.model.MFA
import org.poweruptime.backend.features.authentication.model.MFABackupCode
import org.poweruptime.backend.features.authentication.model.PasswordResetToken
import org.poweruptime.backend.features.authentication.model.RefreshToken
import org.poweruptime.backend.features.authentication.model.Session
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.deadLetter.DeadLetter
import org.poweruptime.backend.features.fileUpload.File
import org.poweruptime.backend.features.info.instanceSetting.InstanceSetting
import org.poweruptime.backend.features.info.versionChecker.VersionCheckMail
import org.poweruptime.backend.features.monitor.checker.dns.DnsMonitorData
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorData
import org.poweruptime.backend.features.monitor.checker.ping.PingMonitorData
import org.poweruptime.backend.features.monitor.checker.push.PushMonitorCheckerEntry
import org.poweruptime.backend.features.monitor.checker.push.PushMonitorData
import org.poweruptime.backend.features.monitor.checker.ssl.SSLCertificateMonitorData
import org.poweruptime.backend.features.monitor.model.CheckResult
import org.poweruptime.backend.features.monitor.model.CheckResultLogEntry
import org.poweruptime.backend.features.monitor.model.HistoricalDayUptime
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.notification.model.MonitorNotificationMethod
import org.poweruptime.backend.features.notification.model.Notification
import org.poweruptime.backend.features.notification.model.NotificationMethod
import org.poweruptime.backend.features.notification.model.SubNotification
import org.poweruptime.backend.features.notification.notificationMethods.apprise.AppriseNotificationMethodData
import org.poweruptime.backend.features.notification.notificationMethods.discord.DiscordNotificationMethodData
import org.poweruptime.backend.features.notification.notificationMethods.email.EmailNotificationMethodData
import org.poweruptime.backend.features.notification.notificationMethods.slack.SlackNotificationMethodData
import org.poweruptime.backend.features.profile.EmailChangeToken
import org.poweruptime.backend.features.statusPage.model.StatusPage
import org.poweruptime.backend.features.statusPage.model.StatusPageDomainName
import org.poweruptime.backend.features.statusPage.model.StatusPageGroup
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupMonitor
import org.poweruptime.backend.features.tag.MonitorTag
import org.poweruptime.backend.features.tag.Tag
import org.poweruptime.backend.features.team.model.Team
import org.poweruptime.backend.features.team.model.TeamJoinToken
import org.poweruptime.backend.features.team.model.TeamSetting
import org.poweruptime.backend.features.team.model.TeamUser
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
        DeadLetter,
        File,
        InstanceSetting,
        VersionCheckMail,
        MFA,
        User,
        Team,
        Monitor,
        DnsMonitorData,
        HttpMonitorData,
        PingMonitorData,
        PushMonitorData,
        SSLCertificateMonitorData,
        PushMonitorCheckerEntry,
        AppriseNotificationMethodData,
        DiscordNotificationMethodData,
        EmailNotificationMethodData,
        SlackNotificationMethodData,
        MFABackupCode,
        CheckResult,
        CheckResultLogEntry,
        HistoricalDayUptime,
        Notification,
        NotificationMethod,
        MonitorNotificationMethod,
        StatusPage,
        StatusPageDomainName,
        StatusPageGroup,
        StatusPageGroupMonitor,
        SubNotification,
        Tag,
        MonitorTag,
        TeamSetting,
        EmailChangeToken,
        PasswordResetToken,
        Session,
        RefreshToken,
        TeamJoinToken,
        TeamUser,
    )
}
