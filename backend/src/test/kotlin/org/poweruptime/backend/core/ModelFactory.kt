package org.poweruptime.backend.core

import org.poweruptime.backend.core.utils.NANO_ID_MAX_LENGTH
import org.poweruptime.backend.core.utils.NANO_ID_SMALL_LENGTH
import org.poweruptime.backend.core.utils.RandomGenerator
import org.poweruptime.backend.features.authentication.LoginDto
import org.poweruptime.backend.features.authentication.model.SystemRole
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorCheckerData
import org.poweruptime.backend.features.monitor.checker.ping.PingMonitorCheckerData
import org.poweruptime.backend.features.monitor.core.MonitorCheckerData
import org.poweruptime.backend.features.monitor.dto.CreateMonitorDto
import org.poweruptime.backend.features.monitor.dto.UpdateMonitorDto
import org.poweruptime.backend.features.monitor.model.CheckResult
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.notification.core.NotificationSenderData
import org.poweruptime.backend.features.notification.model.Notification
import org.poweruptime.backend.features.notification.model.NotificationMethod
import org.poweruptime.backend.features.systemNotification.dto.CreateSystemNotificationDto
import org.poweruptime.backend.features.systemNotification.dto.UpdateSystemNotificationDto
import org.poweruptime.backend.features.systemNotification.model.SystemNotificationType
import org.poweruptime.backend.features.team.dto.CreateTeamDto
import org.poweruptime.backend.features.team.dto.InviteTeamUserDto
import org.poweruptime.backend.features.team.dto.UpdateTeamDto
import org.poweruptime.backend.features.team.dto.UpdateTeamUserDto
import org.poweruptime.backend.features.team.model.Team
import org.poweruptime.backend.features.team.model.TeamRole
import org.poweruptime.backend.features.user.dto.CreateUserDto
import java.time.Instant

object ModelFactory {
    fun getTestTeam(name: String = "acme") = Team(name).apply {
        id = RandomGenerator.nanoId(NANO_ID_SMALL_LENGTH)
    }
    fun getTestUser(name: String = "Franz Huber", email: String = "franz.huber@gmail1234.com") = User(
        name = name,
        email = email,
        activated = true,
        passwordHash = "",
        personalTeam = Team("Test Personal Team"),
    )

    fun getTestMonitor(
        checker: MonitorCheckerData = PingMonitorCheckerData(
            "1.1.1.1",
            443,
        ),
        name: String = "Test"
    ) = Monitor(
        name = name,
        testIntervalSeconds = 30,
        retries = 3,
        upsideDown = false,
        checker = checker,
        team = getTestTeam(),
        description = null,
    ).apply {
        id = RandomGenerator.nanoId(NANO_ID_MAX_LENGTH)
    }

    fun getTestCheckResult(
        status: MonitorStatus = MonitorStatus.UP,
        monitor: Monitor = getTestMonitor(HttpMonitorCheckerData()),
        previousStatus: MonitorStatus = status,
        pickedUpAt: Instant? = Instant.now(),
        checkedAt: Instant? = Instant.now(),
        pingMs: Long? = 1000,
        title: String? = "Test Title",
        message: String? = "Test Message",
    ) = CheckResult(
        status = status,
        monitor = monitor,
        previousStatus = previousStatus,
        pickedUpAt = pickedUpAt,
        checkedAt = checkedAt,
        pingMs = pingMs,
        title = title,
        message = message,
    ).apply {
        id = RandomGenerator.nanoId(NANO_ID_MAX_LENGTH)
    }

    fun getTestNotificationMethod(
        name: String = "Test",
        sender: NotificationSenderData,
    ) = NotificationMethod(
        name = name,
        sender = sender,
        team = getTestTeam(),
        useByDefault = false,
    )

    fun getTestNotification(
        sender: NotificationSenderData,
        pickedUpAt: Instant? = Instant.now(),
        title: String = "Test Title",
        checkResult: CheckResult = getTestCheckResult(title = title)
    ) = Notification(
        checkResult = checkResult,
        title = title,
        message = "Test Message",
        method = getTestNotificationMethod(sender = sender),
        pickedUpAt = pickedUpAt,
    ).apply {
        id = RandomGenerator.nanoId(NANO_ID_MAX_LENGTH)
    }

    fun getCreateSystemNotification() = CreateSystemNotificationDto(
        title = "Danger Danger Danger",
        description = "Cool description",
        active = true,
        type = SystemNotificationType.DANGER,
        starts = Instant.now(),
        ends = Instant.now().plusSeconds(60),
    )

    fun getUpdateSystemNotification(id: String) = UpdateSystemNotificationDto(
        id = id,
        title = "Planned Maintenance Updated",
        description = "Updated",
        active = true,
        type = SystemNotificationType.WARNING,
        starts = null,
        ends = null,
    )

    fun getCreateUserDto() = CreateUserDto(
        name = "Herbert",
        email = "test@unit.at",
        password = "testpatestpasswordtestpasswordtestpasswordssword",
        activated = true,
        sendInvitation = false,
        role = SystemRole.ADMIN,
    )

    fun getAdminSignInDto(stayLoggedIn: Boolean = true) = LoginDto(
        email = "admin@admin.org",
        password = "admin",
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
        checker: MonitorCheckerData,
        teamId: String = "4Lxhu5YKWPBr", // Team 1
    ) = CreateMonitorDto(
        teamId = teamId,
        name = "Test Monitor",
        description = null,
        testIntervalSeconds = 60,
        retries = 0,
        resendAfter = null,
        upsideDown = false,
        checker = checker,
    )

    fun getUpdateMonitorDto(
        id: String,
        checker: MonitorCheckerData,
        name: String? = null
    ) = UpdateMonitorDto(
        id = id,
        name = name ?: "Updated Test Monitor",
        description = null,
        testIntervalSeconds = 60,
        retries = 0,
        resendAfter = null,
        upsideDown = false,
        checker = checker,
    )
}
