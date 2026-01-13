package org.poweruptime.backend.core

import org.poweruptime.backend.core.utils.NANO_ID_MAX_LENGTH
import org.poweruptime.backend.core.utils.NANO_ID_SMALL_LENGTH
import org.poweruptime.backend.core.utils.RandomGenerator
import org.poweruptime.backend.features.authentication.LoginDto
import org.poweruptime.backend.features.authentication.SetupDto
import org.poweruptime.backend.features.authentication.model.SystemRole
import org.poweruptime.backend.features.authentication.model.UserRecord
import org.poweruptime.backend.features.info.instanceSetting.dto.InstanceSettingSupportDto
import org.poweruptime.backend.features.info.instanceSetting.dto.InstanceSettingVersionCheckDto
import org.poweruptime.backend.features.info.instanceSetting.dto.SettingRetentionDto
import org.poweruptime.backend.features.monitor.checkers.ping.PingMonitorDataRecord
import org.poweruptime.backend.features.monitor.core.MonitorData
import org.poweruptime.backend.features.monitor.dto.CreateMonitorDto
import org.poweruptime.backend.features.monitor.dto.UpdateMonitorDto
import org.poweruptime.backend.features.monitor.model.CheckResultRecord
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.MonitorType
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.dto.CreateNotificationMethodDto
import org.poweruptime.backend.features.notification.dto.UpdateNotificationMethodDto
import org.poweruptime.backend.features.notification.model.NotificationMethodData
import org.poweruptime.backend.features.notification.model.NotificationMethodRecord
import org.poweruptime.backend.features.notification.model.NotificationRecord
import org.poweruptime.backend.features.notification.model.SubNotificationRecord
import org.poweruptime.backend.features.team.dto.CreateTeamDto
import org.poweruptime.backend.features.team.dto.InviteTeamUserDto
import org.poweruptime.backend.features.team.dto.UpdateTeamDto
import org.poweruptime.backend.features.team.dto.UpdateTeamUserDto
import org.poweruptime.backend.features.team.model.TeamRecord
import org.poweruptime.backend.features.team.model.TeamRole
import org.poweruptime.backend.features.user.CreateUserDto
import org.poweruptime.backend.features.user.UpdateUserDto
import java.time.Instant

object ModelFactory {
    private var idCounter = 1UL

    fun getId() = idCounter.also {
        idCounter++
    }

    fun getTestTeam(name: String = "acme") = TeamRecord(
        id = getId(),
        publicId = RandomGenerator.nanoId(NANO_ID_SMALL_LENGTH),
        createdAt = Instant.now(),
        updatedAt = Instant.now(),
        deleted = null,
        personalUserId = null,
        name = name,
    )

    fun getTestUser(name: String = "Franz Huber", email: String = "franz.huber@gmail1234.com") = UserRecord(
        name = name,
        email = email,
        activated = true,
        passwordHash = "",
        id = getId(),
        publicId = RandomGenerator.nanoId(NANO_ID_SMALL_LENGTH),
        createdAt = Instant.now(),
        updatedAt = Instant.now(),
        mfaId = null,
        forcePasswordChange = false,
        role = SystemRole.USER,
    )

    fun getTestMonitorData() = PingMonitorDataRecord(
        "1.1.1.1",
        443,
    )

    fun getTestMonitor(
        type: MonitorType = MonitorType.DNS,
        name: String = "Test",
        status: MonitorStatus = MonitorStatus.PENDING
    ) = MonitorRecord(
        name = name,
        testIntervalSeconds = 30,
        retries = 3,
        upsideDown = false,
        description = null,
        id = getId(),
        publicId = RandomGenerator.nanoId(NANO_ID_MAX_LENGTH),
        createdAt = Instant.now(),
        updatedAt = Instant.now(),
        deleted = null,
        teamId = getTestTeam().id,
        type = type,
        resendAfter = null,
        status = status,
    )

    fun getTestCheckResult(
        status: MonitorStatus = MonitorStatus.UP,
        monitorId: ULong = getTestMonitor().id,
        previousStatus: MonitorStatus = status,
        pickedUpAt: Instant? = Instant.now(),
        checkedAt: Instant? = Instant.now(),
        pingMs: Long? = 1000,
        title: String? = "Test Title",
        message: String? = "Test Message",
    ) = CheckResultRecord(
        status = status,
        monitorId = monitorId,
        previousStatus = previousStatus,
        pickedUpAt = pickedUpAt,
        checkedAt = checkedAt,
        pingMs = pingMs,
        title = title,
        message = message,
        id = getId(),
        publicId = RandomGenerator.nanoId(NANO_ID_MAX_LENGTH),
        createdAt = Instant.now(),
        updatedAt = Instant.now(),
        timesRetried = null,
    )

    fun getTestNotificationMethod(
        name: String = "Test",
        type: NotificationMethodType = NotificationMethodType.APPRISE,
        teamId: ULong = getTestTeam().id,
    ) = NotificationMethodRecord(
        name = name,
        type = type,
        teamId = teamId,
        useByDefault = false,
        id = getId(),
        publicId = RandomGenerator.nanoId(NANO_ID_SMALL_LENGTH),
        createdAt = Instant.now(),
        updatedAt = Instant.now(),
        deleted = null,
        titleTemplate = null,
        bodyTemplate = null,
    )

    fun getTestNotification(
        title: String = "Test Title",
        checkResultId: ULong = getTestCheckResult(title = title).id,
        monitorId: ULong = 1UL,
        publicCheckResultId: String = RandomGenerator.nanoId(NANO_ID_MAX_LENGTH),
        status: MonitorStatus = MonitorStatus.UP,
    ) = NotificationRecord(
        checkResultId = checkResultId,
        title = title,
        id = getId(),
        publicId = RandomGenerator.nanoId(NANO_ID_MAX_LENGTH),
        createdAt = Instant.now(),
        updatedAt = Instant.now(),
        monitorId = monitorId,
        publicCheckResultId = publicCheckResultId,
        status = status,
    )

    fun getTestSubNotification(
        notificationId: ULong = getTestNotification().id,
        methodId: ULong = getTestNotificationMethod().id,
        pickedUpAt: Instant? = Instant.now(),
        title: String = "Test Title",
    ) = SubNotificationRecord(
        notificationId = notificationId,
        methodId = methodId,
        title = title,
        message = "Test Message",
        pickedUpAt = pickedUpAt,
        id = getId(),
        publicId = RandomGenerator.nanoId(NANO_ID_MAX_LENGTH),
        createdAt = Instant.now(),
        updatedAt = Instant.now(),
        sentAt = null,
        error = null,
    )

    fun getCreateUserDto(
        name: String = "Test User",
        email: String = "testuser${System.nanoTime()}@example.com",
        password: String? = "TestPassword123",
        sendInvitation: Boolean = false,
        activated: Boolean = false,
        role: SystemRole = SystemRole.USER,
    ): CreateUserDto = CreateUserDto(
        name = name,
        email = email,
        password = password,
        sendInvitation = sendInvitation,
        activated = activated,
        role = role,
    )

    fun getUpdateUserDto(
        id: String,
        name: String = "Test User",
        email: String = "testuser${System.nanoTime()}@example.com",
        password: String? = "TestPassword123",
        sendInvitation: Boolean = false,
        activated: Boolean = false,
        role: SystemRole = SystemRole.USER,
        forcePasswordChange: Boolean = false,
    ): UpdateUserDto = UpdateUserDto(
        id = id,
        name = name,
        email = email,
        password = password,
        sendInvitation = sendInvitation,
        activated = activated,
        role = role,
        forcePasswordChange = forcePasswordChange,
    )

    fun getAdminSignInDto(stayLoggedIn: Boolean = true) = LoginDto(
        email = "admin@admin.org",
        password = "admin1234",
        sessionInformation = "TestTestTestTest",
        stayLoggedIn = stayLoggedIn,
    )

    fun getCreateTeamDto() = CreateTeamDto(
        name = "Test Team",
    )

    fun getUpdateTeamDto(id: String, name: String? = null) = UpdateTeamDto(
        id = id,
        name = name ?: "Test Updated Team",
    )

    fun getInviteTeamUserDto(role: TeamRole = TeamRole.MEMBER, email: String = "test9999@test.org") =
        InviteTeamUserDto(role, email)

    fun getUpdateTeamUserDto(userId: String = "9999", role: TeamRole = TeamRole.MEMBER) =
        UpdateTeamUserDto(userId, role)

    fun getCreateMonitorDto(
        data: MonitorData,
        teamId: String = "4Lxhu5YKWPBr", // Team 1
    ) = CreateMonitorDto(
        teamId = teamId,
        name = "Test Monitor",
        description = null,
        testIntervalSeconds = 60,
        retries = null,
        resendAfter = null,
        upsideDown = false,
        data = data,
        notificationMethodIds = listOf(),
        tags = listOf(),
    )

    fun getUpdateMonitorDto(
        id: String,
        data: MonitorData,
        name: String? = null
    ) = UpdateMonitorDto(
        id = id,
        name = name ?: "Updated Test Monitor",
        description = null,
        testIntervalSeconds = 60,
        retries = null,
        resendAfter = null,
        upsideDown = false,
        data = data,
        notificationMethodIds = listOf(),
        tags = listOf(),
    )

    fun getCreateNotificationMethodDto(
        data: NotificationMethodData,
        teamId: String = "4Lxhu5YKWPBr", // Team 1
    ) = CreateNotificationMethodDto(
        teamId = teamId,
        name = "Test Notification Method",
        data = data,
        useByDefault = false,
        titleTemplate = null,
        bodyTemplate = null,
        monitorIds = listOf(),
    )

    fun getUpdateNotificationMethodDto(
        id: String,
        data: NotificationMethodData,
        name: String? = null
    ) = UpdateNotificationMethodDto(
        id = id,
        name = name ?: "Updated Test Notification Method",
        data = data,
        useByDefault = false,
        titleTemplate = null,
        bodyTemplate = null,
        monitorIds = listOf(),
    )

    fun getTestSetupDto() = SetupDto(
        name = "admin",
        email = "admin@admin.org",
    )

    fun getInstanceSettingSupportDto(
        supportLookup: String? = null,
        showSupportBadge: Boolean = true,
    ): InstanceSettingSupportDto = InstanceSettingSupportDto(
        supportLookup = supportLookup,
        showSupportBadge = showSupportBadge,
    )

    fun getInstanceSettingRetentionDto(
        checkResultRetentionPeriodInDays: Int = 365,
        checkResultLogRetentionPeriodInDays: Int = 182,
    ): SettingRetentionDto = SettingRetentionDto(
        checkResultRetentionPeriodInDays = checkResultRetentionPeriodInDays,
        checkResultLogRetentionPeriodInDays = checkResultLogRetentionPeriodInDays,
    )

    fun getInstanceSettingVersionCheckDto(
        versionCheckEnabled: Boolean = false,
        versionCheckAdminMailEnabled: Boolean = false,
        versionCheckAdminMailTo: Set<String>? = null,
    ): InstanceSettingVersionCheckDto = InstanceSettingVersionCheckDto(
        versionCheckEnabled = versionCheckEnabled,
        versionCheckAdminMailEnabled = versionCheckAdminMailEnabled,
        versionCheckAdminMailTo = versionCheckAdminMailTo,
    )
}
