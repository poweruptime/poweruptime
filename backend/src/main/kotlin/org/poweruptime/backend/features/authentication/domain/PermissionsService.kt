@file:Suppress("TooManyFunctions", "UnusedReceiverParameter")

package org.poweruptime.backend.features.authentication.domain

import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.core.exceptions.ForbiddenException
import org.poweruptime.backend.features.authentication.model.UserTable
import org.poweruptime.backend.features.authentication.service.isAdmin
import org.poweruptime.backend.features.authentication.service.publicUserId
import org.poweruptime.backend.features.monitor.model.CheckResultTable
import org.poweruptime.backend.features.monitor.model.MonitorTable
import org.poweruptime.backend.features.notification.model.NotificationMethodTable
import org.poweruptime.backend.features.notification.model.NotificationTable
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupTable
import org.poweruptime.backend.features.statusPage.model.StatusPageTable
import org.poweruptime.backend.features.team.model.TeamRole
import org.poweruptime.backend.features.team.model.TeamTable
import org.poweruptime.backend.features.team.model.TeamUserRecord
import org.poweruptime.backend.features.team.model.TeamUserTable
import org.poweruptime.backend.features.team.model.rowToTeamUserRecord
import org.springframework.security.core.Authentication
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class PermissionsService {
    //region isPartOf
    fun isPartOfByTeamId(
        publicUserId: String,
        publicTeamId: String
    ): Boolean =
        TeamUserTable
            .innerJoin(UserTable, { TeamUserTable.userId }, { UserTable.id })
            .innerJoin(TeamTable, { TeamUserTable.teamId }, { TeamTable.id })
            .selectAll()
            .where {
                (UserTable.publicId eq publicUserId) and (TeamTable.publicId eq publicTeamId)
            }.count() > 0

    fun isPartOfByMonitorId(
        publicUserId: String,
        publicMonitorId: String
    ): Boolean = TeamUserTable
        .innerJoin(UserTable, { TeamUserTable.userId }, { UserTable.id })
        .innerJoin(TeamTable, { TeamUserTable.teamId }, { TeamTable.id })
        .innerJoin(MonitorTable)
        .selectAll()
        .where {
            (UserTable.publicId eq publicUserId) and (MonitorTable.publicId eq publicMonitorId)
        }.count() > 0

    fun isPartOfByCheckResultId(
        publicUserId: String,
        publicCheckResultId: String
    ): Boolean = TeamUserTable
        .innerJoin(UserTable, { TeamUserTable.userId }, { UserTable.id })
        .innerJoin(TeamTable, { TeamUserTable.teamId }, { TeamTable.id })
        .innerJoin(MonitorTable)
        .innerJoin(CheckResultTable)
        .selectAll()
        .where {
            (UserTable.publicId eq publicUserId) and (CheckResultTable.publicId eq publicCheckResultId)
        }.count() > 0

    fun isPartOfByNotificationMethodId(
        publicUserId: String,
        publicNotificationMethodId: String
    ): Boolean = TeamUserTable
        .innerJoin(UserTable, { TeamUserTable.userId }, { UserTable.id })
        .innerJoin(TeamTable, { TeamUserTable.teamId }, { TeamTable.id })
        .innerJoin(NotificationMethodTable)
        .selectAll()
        .where {
            (UserTable.publicId eq publicUserId) and (NotificationMethodTable.publicId eq publicNotificationMethodId)
        }.count() > 0

    fun isPartOfByNotificationId(
        publicUserId: String,
        publicNotificationId: String
    ): Boolean = TeamUserTable
        .innerJoin(UserTable, { TeamUserTable.userId }, { UserTable.id })
        .innerJoin(TeamTable, { TeamUserTable.teamId }, { TeamTable.id })
        .innerJoin(MonitorTable)
        .innerJoin(CheckResultTable)
        .innerJoin(NotificationTable)
        .selectAll()
        .where {
            (UserTable.publicId eq publicUserId) and (NotificationTable.publicId eq publicNotificationId)
        }.count() > 0

    fun isPartOfByStatusPageId(
        publicUserId: String,
        publicStatusPageId: String
    ): Boolean = TeamUserTable
        .innerJoin(UserTable, { TeamUserTable.userId }, { UserTable.id })
        .innerJoin(TeamTable, { TeamUserTable.teamId }, { TeamTable.id })
        .innerJoin(StatusPageTable)
        .selectAll()
        .where {
            (UserTable.publicId eq publicUserId) and (StatusPageTable.publicId eq publicStatusPageId)
        }.count() > 0

    fun isPartOfByStatusPageGroupId(
        publicUserId: String,
        publicStatusPageGroupId: String
    ): Boolean =
        TeamUserTable
            .innerJoin(UserTable, { TeamUserTable.userId }, { UserTable.id })
            .innerJoin(TeamTable, { TeamUserTable.teamId }, { TeamTable.id })
            .innerJoin(StatusPageTable)
            .innerJoin(StatusPageGroupTable)
            .selectAll()
            .where {
                (UserTable.publicId eq publicUserId) and (StatusPageGroupTable.publicId eq publicStatusPageGroupId)
            }.count() > 0
//endregion

    //region findByEntityId
    fun findByTeamId(
        publicUserId: String,
        publicTeamId: String
    ): TeamUserRecord? = TeamUserTable
        .innerJoin(UserTable, { TeamUserTable.userId }, { UserTable.id })
        .innerJoin(TeamTable, { TeamUserTable.teamId }, { TeamTable.id })
        .selectAll()
        .where {
            (UserTable.publicId eq publicUserId) and (TeamTable.publicId eq publicTeamId)
        }.firstOrNull()?.let { TeamUserTable.rowToTeamUserRecord(it) }

    fun findByMonitorId(
        publicUserId: String,
        publicMonitorId: String
    ): TeamUserRecord? = TeamUserTable
        .innerJoin(UserTable, { TeamUserTable.userId }, { UserTable.id })
        .innerJoin(TeamTable, { TeamUserTable.teamId }, { TeamTable.id })
        .innerJoin(MonitorTable)
        .selectAll()
        .where {
            (UserTable.publicId eq publicUserId) and (MonitorTable.publicId eq publicMonitorId)
        }.firstOrNull()?.let { TeamUserTable.rowToTeamUserRecord(it) }

    fun findByCheckResultId(
        publicUserId: String,
        publicCheckResultId: String
    ): TeamUserRecord? = TeamUserTable
        .innerJoin(UserTable, { TeamUserTable.userId }, { UserTable.id })
        .innerJoin(TeamTable, { TeamUserTable.teamId }, { TeamTable.id })
        .innerJoin(MonitorTable)
        .innerJoin(CheckResultTable)
        .selectAll()
        .where {
            (UserTable.publicId eq publicUserId) and (CheckResultTable.publicId eq publicCheckResultId)
        }.firstOrNull()?.let { TeamUserTable.rowToTeamUserRecord(it) }

    fun findByNotificationMethodId(
        publicUserId: String,
        publicNotificationMethodId: String
    ): TeamUserRecord? = TeamUserTable
        .innerJoin(UserTable, { TeamUserTable.userId }, { UserTable.id })
        .innerJoin(TeamTable, { TeamUserTable.teamId }, { TeamTable.id })
        .innerJoin(NotificationMethodTable)
        .selectAll()
        .where {
            (UserTable.publicId eq publicUserId) and (NotificationMethodTable.publicId eq publicNotificationMethodId)
        }.firstOrNull()?.let { TeamUserTable.rowToTeamUserRecord(it) }

    fun findByNotificationId(
        publicUserId: String,
        publicNotificationId: String
    ): TeamUserRecord? = TeamUserTable
        .innerJoin(UserTable, { TeamUserTable.userId }, { UserTable.id })
        .innerJoin(TeamTable, { TeamUserTable.teamId }, { TeamTable.id })
        .innerJoin(MonitorTable)
        .innerJoin(CheckResultTable)
        .innerJoin(NotificationTable)
        .selectAll()
        .where {
            (UserTable.publicId eq publicUserId) and (NotificationTable.publicId eq publicNotificationId)
        }.firstOrNull()?.let { TeamUserTable.rowToTeamUserRecord(it) }

    fun findByStatusPageId(
        publicUserId: String,
        publicStatusPageId: String
    ): TeamUserRecord? = TeamUserTable
        .innerJoin(UserTable, { TeamUserTable.userId }, { UserTable.id })
        .innerJoin(TeamTable, { TeamUserTable.teamId }, { TeamTable.id })
        .innerJoin(StatusPageTable)
        .selectAll()
        .where {
            (UserTable.publicId eq publicUserId) and (StatusPageTable.publicId eq publicStatusPageId)
        }.firstOrNull()?.let { TeamUserTable.rowToTeamUserRecord(it) }

    fun findByStatusPageGroupId(
        publicUserId: String,
        publicStatusPageGroupId: String
    ): TeamUserRecord? = TeamUserTable
        .innerJoin(UserTable, { TeamUserTable.userId }, { UserTable.id })
        .innerJoin(TeamTable, { TeamUserTable.teamId }, { TeamTable.id })
        .innerJoin(StatusPageTable)
        .innerJoin(StatusPageGroupTable)
        .selectAll()
        .where {
            (UserTable.publicId eq publicUserId) and (StatusPageGroupTable.publicId eq publicStatusPageGroupId)
        }.firstOrNull()?.let { TeamUserTable.rowToTeamUserRecord(it) }

//endregion

    //region isUserPartOfBy ... AndRole
    fun isPartOfByTeamIdAndRole(
        publicUserId: String,
        publicTeamId: String,
        role: TeamRole
    ) = (findByTeamId(publicUserId, publicTeamId)?.role == role)

    fun isPartOfByMonitorIdAndRole(
        userId: String,
        monitorId: String,
        role: TeamRole
    ) = (findByMonitorId(userId, monitorId)?.role == role)

    fun isPartOfByCheckResultIdAndRole(
        userId: String,
        checkResultId: String,
        role: TeamRole
    ) = (findByCheckResultId(userId, checkResultId)?.role == role)

    fun isPartOfByNotificationMethodIdAndRole(
        publicUserId: String,
        publicNotificationMethodId: String,
        role: TeamRole
    ) = (findByNotificationMethodId(publicUserId, publicNotificationMethodId)?.role == role)

    fun isPartOfByNotificationIdAndRole(
        publicUserId: String,
        publicNotificationId: String,
        role: TeamRole
    ) = (findByNotificationId(publicUserId, publicNotificationId)?.role == role)

    fun isPartOfByStatusPageAndRole(
        publicUserId: String,
        publicStatusPageId: String,
        role: TeamRole
    ) = (findByStatusPageId(publicUserId, publicStatusPageId)?.role == role)

    fun isPartOfByStatusPageGroupAndRole(
        publicUserId: String,
        publicStatusPageGroupId: String,
        role: TeamRole
    ) = (findByStatusPageGroupId(publicUserId, publicStatusPageGroupId)?.role == role)

//endregion

    //region isUserAdminOf
    fun isAdminOfByTeamId(
        publicUserId: String,
        publicTeamId: String
    ) = isPartOfByTeamIdAndRole(publicUserId, publicTeamId, TeamRole.ADMIN)

    fun isAdminOfByMonitorId(
        publicUserId: String,
        publicMonitorId: String
    ) = isPartOfByMonitorIdAndRole(publicUserId, publicMonitorId, TeamRole.ADMIN)

    fun isAdminOfByCheckResultId(
        userId: String,
        checkResultId: String
    ) = isPartOfByCheckResultIdAndRole(userId, checkResultId, TeamRole.ADMIN)

    fun isAdminOfByNotificationMethodId(
        publicUserId: String,
        publicNotificationMethodId: String
    ) = isPartOfByNotificationMethodIdAndRole(publicUserId, publicNotificationMethodId, TeamRole.ADMIN)

    fun isAdminOfByNotificationId(
        publicUserId: String,
        publicNotificationId: String
    ) = isPartOfByNotificationIdAndRole(publicUserId, publicNotificationId, TeamRole.ADMIN)

    fun isAdminOfByStatusPageId(
        publicUserId: String,
        publicStatusPageId: String
    ) = isPartOfByStatusPageAndRole(publicUserId, publicStatusPageId, TeamRole.ADMIN)

    fun isAdminOfByStatusPageGroupId(
        publicUserId: String,
        publicStatusPageGroupId: String
    ) = isPartOfByStatusPageGroupAndRole(publicUserId, publicStatusPageGroupId, TeamRole.ADMIN)

//endregion

    fun isPartOfByTeamIds(
        publicUserId: String,
        publicTeamIds: Collection<String>
    ): Boolean = publicTeamIds.all { isPartOfByTeamId(publicUserId, it) }

    fun isPartOfByNotificationMethodIds(
        userId: String,
        publicNotificationMethodIds: Collection<String>
    ): Boolean = publicNotificationMethodIds.all { isPartOfByNotificationMethodId(userId, it) }

    fun isPartOfByStatusPageGroupIds(
        publicUserId: String,
        publicStatusPageGroupIds: Collection<String>
    ): Boolean = publicStatusPageGroupIds.all { isPartOfByStatusPageGroupId(publicUserId, it) }
}

fun Authentication.throwIfNotPartOf(checker: (publicUserId: String) -> Boolean) {
    if (!isAdmin() && !checker(publicUserId())) {
        throw ForbiddenException()
    }
}

fun <T> List<T>.ensureAllInTeam(teamId: ULong, getTeamId: (it: T) -> ULong): List<T> {
    if (!this.all { getTeamId(it) == teamId }) {
        throw ForbiddenException("Tried to use entities mixed by team.")
    }

    return this
}
