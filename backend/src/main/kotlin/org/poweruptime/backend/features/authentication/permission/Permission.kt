package org.poweruptime.backend.features.authentication.permission

import org.jetbrains.exposed.v1.core.Column
import org.jetbrains.exposed.v1.core.Join
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.dao.id.IdTable
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.jdbc.Query
import org.jetbrains.exposed.v1.jdbc.select
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.monitor.model.CheckResult
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.notification.model.Notification
import org.poweruptime.backend.features.notification.model.NotificationMethod
import org.poweruptime.backend.features.statusPage.model.StatusPage
import org.poweruptime.backend.features.statusPage.model.StatusPageGroup
import org.poweruptime.backend.features.team.model.TeamRole
import org.poweruptime.backend.features.team.model.TeamUser
import org.poweruptime.backend.features.team.model.Team as TeamTable

const val TEAM = "TEAM"
const val TEAM_ADMIN = "${TEAM}_ADMIN"
const val TEAM_MEMBER = "${TEAM}_MEMBER"

const val MONITOR = "MONITOR"
const val MONITOR_ADMIN = "${MONITOR}_ADMIN"
const val MONITOR_MEMBER = "${MONITOR}_MEMBER"

const val CHECK_RESULT = "CHECK_RESULT"
const val CHECK_RESULT_ADMIN = "${CHECK_RESULT}_ADMIN"
const val CHECK_RESULT_MEMBER = "${CHECK_RESULT}_MEMBER"

const val NOTIFICATION_METHOD = "NOTIFICATION_METHOD"
const val NOTIFICATION_METHOD_ADMIN = "${NOTIFICATION_METHOD}_ADMIN"
const val NOTIFICATION_METHOD_MEMBER = "${NOTIFICATION_METHOD}_MEMBER"

const val NOTIFICATION = "NOTIFICATION"
const val NOTIFICATION_ADMIN = "${NOTIFICATION}_ADMIN"
const val NOTIFICATION_MEMBER = "${NOTIFICATION}_MEMBER"

const val STATUS_PAGE = "STATUS_PAGE"
const val STATUS_PAGE_ADMIN = "${STATUS_PAGE}_ADMIN"
const val STATUS_PAGE_MEMBER = "${STATUS_PAGE}_MEMBER"

const val STATUS_PAGE_GROUP = "STATUS_PAGE_GROUP"
const val STATUS_PAGE_GROUP_ADMIN = "${STATUS_PAGE_GROUP}_ADMIN"
const val STATUS_PAGE_GROUP_MEMBER = "${STATUS_PAGE_GROUP}_MEMBER"

abstract class PermissionChecker {
    open fun applyAdditionalJoins(baseJoins: Join): Join = baseJoins

    open fun getTablesToJoin(): List<Any> = emptyList()

    abstract fun getEntityPublicIdColumn(): Column<String>
}

data class PermissionRequest(val permission: Permission, val requiredRole: TeamRole?) {
    val permissionName: String
        get() = when (requiredRole) {
            TeamRole.ADMIN -> "${permission.baseName}_ADMIN"
            TeamRole.MEMBER, null -> "${permission.baseName}_MEMBER"
        }
}

enum class Permission(val baseName: String, private val checker: PermissionChecker) {
    Team(TEAM, TeamPermissionChecker),
    Monitor(MONITOR, MonitorPermissionChecker),
    CheckResult(CHECK_RESULT, CheckResultPermissionChecker),
    NotificationMethod(NOTIFICATION_METHOD, NotificationMethodPermissionChecker),
    Notification(NOTIFICATION, NotificationPermissionChecker),
    StatusPage(STATUS_PAGE, StatusPagePermissionChecker),
    StatusPageGroup(STATUS_PAGE_GROUP, StatusPageGroupPermissionChecker),
    ;

    fun buildQuery(publicUserId: String, entityId: String): Query {
        var baseJoin = checker.applyAdditionalJoins(
            TeamUser
                .innerJoin(User, { TeamUser.userId }, { User.id })
                .innerJoin(TeamTable, { TeamUser.teamId }, { TeamTable.id }),
        )

        for (table in checker.getTablesToJoin()) {
            if (table is IdTable<*>) {
                baseJoin = baseJoin.innerJoin(table)
            }
        }

        val entityPublicIdColumn = checker.getEntityPublicIdColumn()

        return checker
            .applyAdditionalJoins(baseJoin)
            .select(TeamUser.role, User.publicId, entityPublicIdColumn)
            .where {
                (User.publicId eq publicUserId) and (entityPublicIdColumn eq entityId)
            }
    }

    companion object {
        fun fromPermissionName(permissionName: String): PermissionRequest? = when {
            permissionName.endsWith("_ADMIN") -> {
                val baseName = permissionName.removeSuffix("_ADMIN")
                entries
                    .find { it.baseName == baseName }
                    ?.let { PermissionRequest(it, TeamRole.ADMIN) }
            }

            permissionName.endsWith("_MEMBER") -> {
                val baseName = permissionName.removeSuffix("_MEMBER")
                entries
                    .find { it.baseName == baseName }
                    ?.let { PermissionRequest(it, TeamRole.MEMBER) }
            }

            else -> null
        }
    }
}

private object TeamPermissionChecker : PermissionChecker() {
    override fun getEntityPublicIdColumn() = TeamTable.publicId
}

private object MonitorPermissionChecker : PermissionChecker() {
    override fun getEntityPublicIdColumn() = Monitor.publicId

    override fun getTablesToJoin() = listOf(Monitor)
}

private object CheckResultPermissionChecker : PermissionChecker() {
    override fun getEntityPublicIdColumn() = CheckResult.publicId

    override fun getTablesToJoin() = listOf(Monitor, CheckResult)
}

private object NotificationMethodPermissionChecker : PermissionChecker() {
    override fun getEntityPublicIdColumn() = NotificationMethod.publicId

    override fun getTablesToJoin() = listOf(NotificationMethod)
}

private object NotificationPermissionChecker : PermissionChecker() {
    override fun getEntityPublicIdColumn() = Notification.publicId

    override fun getTablesToJoin() = listOf(Monitor, Notification)
}

private object StatusPagePermissionChecker : PermissionChecker() {
    override fun getEntityPublicIdColumn() = StatusPage.publicId

    override fun getTablesToJoin() = listOf(StatusPage)
}

private object StatusPageGroupPermissionChecker : PermissionChecker() {
    override fun getEntityPublicIdColumn() = StatusPageGroup.publicId

    override fun getTablesToJoin() = listOf(StatusPage, StatusPageGroup)
}
