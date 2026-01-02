@file:Suppress("TooManyFunctions", "UnusedReceiverParameter")

package org.poweruptime.backend.features.authentication.domain

import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.jdbc.Query
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.core.exceptions.ForbiddenException
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.authentication.service.isAdmin
import org.poweruptime.backend.features.authentication.service.publicUserId
import org.poweruptime.backend.features.monitor.model.CheckResult
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.notification.model.Notification
import org.poweruptime.backend.features.notification.model.NotificationMethod
import org.poweruptime.backend.features.statusPage.model.StatusPage
import org.poweruptime.backend.features.statusPage.model.StatusPageGroup
import org.poweruptime.backend.features.team.model.Team
import org.poweruptime.backend.features.team.model.TeamRole
import org.poweruptime.backend.features.team.model.TeamUser
import org.poweruptime.backend.features.team.model.TeamUserRecord
import org.poweruptime.backend.features.team.model.rowToTeamUserRecord
import org.springframework.security.core.Authentication
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class PermissionsService {
    private fun Query.isPartOfCheck(): Boolean = this.limit(1).count() > 0
    private fun Query.findBy(): TeamUserRecord? = this.limit(1)
        .firstOrNull()
        ?.let { TeamUser.rowToTeamUserRecord(it) }

    //region isPartOf
    fun isPartOfByTeamId(
        publicUserId: String,
        publicTeamId: String
    ): Boolean =
        TeamUser
            .innerJoin(User, { TeamUser.userId }, { User.id })
            .innerJoin(Team, { TeamUser.teamId }, { Team.id })
            .selectAll()
            .where {
                (User.publicId eq publicUserId) and (Team.publicId eq publicTeamId)
            }
            .isPartOfCheck()

    fun isPartOfByMonitorId(
        publicUserId: String,
        publicMonitorId: String
    ): Boolean = TeamUser
        .innerJoin(User, { TeamUser.userId }, { User.id })
        .innerJoin(Team, { TeamUser.teamId }, { Team.id })
        .innerJoin(Monitor)
        .selectAll()
        .where {
            (User.publicId eq publicUserId) and (Monitor.publicId eq publicMonitorId)
        }
        .isPartOfCheck()

    fun isPartOfByCheckResultId(
        publicUserId: String,
        publicCheckResultId: String
    ): Boolean = TeamUser
        .innerJoin(User, { TeamUser.userId }, { User.id })
        .innerJoin(Team, { TeamUser.teamId }, { Team.id })
        .innerJoin(Monitor)
        .innerJoin(CheckResult)
        .selectAll()
        .where {
            (User.publicId eq publicUserId) and (CheckResult.publicId eq publicCheckResultId)
        }
        .isPartOfCheck()

    fun isPartOfByNotificationMethodId(
        publicUserId: String,
        publicNotificationMethodId: String
    ): Boolean = TeamUser
        .innerJoin(User, { TeamUser.userId }, { User.id })
        .innerJoin(Team, { TeamUser.teamId }, { Team.id })
        .innerJoin(NotificationMethod)
        .selectAll()
        .where {
            (User.publicId eq publicUserId) and (NotificationMethod.publicId eq publicNotificationMethodId)
        }
        .isPartOfCheck()

    fun isPartOfByNotificationId(
        publicUserId: String,
        publicNotificationId: String
    ): Boolean = TeamUser
        .innerJoin(User, { TeamUser.userId }, { User.id })
        .innerJoin(Team, { TeamUser.teamId }, { Team.id })
        .innerJoin(Monitor)
        .innerJoin(Notification)
        .selectAll()
        .where {
            (User.publicId eq publicUserId) and (Notification.publicId eq publicNotificationId)
        }
        .isPartOfCheck()

    fun isPartOfByStatusPageId(
        publicUserId: String,
        publicStatusPageId: String
    ): Boolean = TeamUser
        .innerJoin(User, { TeamUser.userId }, { User.id })
        .innerJoin(Team, { TeamUser.teamId }, { Team.id })
        .innerJoin(StatusPage)
        .selectAll()
        .where {
            (User.publicId eq publicUserId) and (StatusPage.publicId eq publicStatusPageId)
        }
        .isPartOfCheck()

    fun isPartOfByStatusPageGroupId(
        publicUserId: String,
        publicStatusPageGroupId: String
    ): Boolean =
        TeamUser
            .innerJoin(User, { TeamUser.userId }, { User.id })
            .innerJoin(Team, { TeamUser.teamId }, { Team.id })
            .innerJoin(StatusPage)
            .innerJoin(StatusPageGroup)
            .selectAll()
            .where {
                (User.publicId eq publicUserId) and (StatusPageGroup.publicId eq publicStatusPageGroupId)
            }
            .isPartOfCheck()
//endregion

    //region findByEntityId
    fun findByTeamId(
        publicUserId: String,
        publicTeamId: String
    ): TeamUserRecord? = TeamUser
        .innerJoin(User, { TeamUser.userId }, { User.id })
        .innerJoin(Team, { TeamUser.teamId }, { Team.id })
        .selectAll()
        .where {
            (User.publicId eq publicUserId) and (Team.publicId eq publicTeamId)
        }
        .findBy()

    fun findByMonitorId(
        publicUserId: String,
        publicMonitorId: String
    ): TeamUserRecord? = TeamUser
        .innerJoin(User, { TeamUser.userId }, { User.id })
        .innerJoin(Team, { TeamUser.teamId }, { Team.id })
        .innerJoin(Monitor)
        .selectAll()
        .where {
            (User.publicId eq publicUserId) and (Monitor.publicId eq publicMonitorId)
        }
        .findBy()

    fun findByCheckResultId(
        publicUserId: String,
        publicCheckResultId: String
    ): TeamUserRecord? = TeamUser
        .innerJoin(User, { TeamUser.userId }, { User.id })
        .innerJoin(Team, { TeamUser.teamId }, { Team.id })
        .innerJoin(Monitor)
        .innerJoin(CheckResult)
        .selectAll()
        .where {
            (User.publicId eq publicUserId) and (CheckResult.publicId eq publicCheckResultId)
        }
        .findBy()

    fun findByNotificationMethodId(
        publicUserId: String,
        publicNotificationMethodId: String
    ): TeamUserRecord? = TeamUser
        .innerJoin(User, { TeamUser.userId }, { User.id })
        .innerJoin(Team, { TeamUser.teamId }, { Team.id })
        .innerJoin(NotificationMethod)
        .selectAll()
        .where {
            (User.publicId eq publicUserId) and (NotificationMethod.publicId eq publicNotificationMethodId)
        }
        .findBy()

    fun findByNotificationId(
        publicUserId: String,
        publicNotificationId: String
    ): TeamUserRecord? = TeamUser
        .innerJoin(User, { TeamUser.userId }, { User.id })
        .innerJoin(Team, { TeamUser.teamId }, { Team.id })
        .innerJoin(Monitor)
        .innerJoin(Notification)
        .selectAll()
        .where {
            (User.publicId eq publicUserId) and (Notification.publicId eq publicNotificationId)
        }
        .findBy()

    fun findByStatusPageId(
        publicUserId: String,
        publicStatusPageId: String
    ): TeamUserRecord? = TeamUser
        .innerJoin(User, { TeamUser.userId }, { User.id })
        .innerJoin(Team, { TeamUser.teamId }, { Team.id })
        .innerJoin(StatusPage)
        .selectAll()
        .where {
            (User.publicId eq publicUserId) and (StatusPage.publicId eq publicStatusPageId)
        }
        .findBy()

    fun findByStatusPageGroupId(
        publicUserId: String,
        publicStatusPageGroupId: String
    ): TeamUserRecord? = TeamUser
        .innerJoin(User, { TeamUser.userId }, { User.id })
        .innerJoin(Team, { TeamUser.teamId }, { Team.id })
        .innerJoin(StatusPage)
        .innerJoin(StatusPageGroup)
        .selectAll()
        .where {
            (User.publicId eq publicUserId) and (StatusPageGroup.publicId eq publicStatusPageGroupId)
        }
        .findBy()

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
