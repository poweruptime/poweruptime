@file:Suppress("TooManyFunctions")

package org.poweruptime.backend.features.authentication.domain

import org.poweruptime.backend.core.exceptions.ForbiddenException
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.team.model.TeamRole
import org.poweruptime.backend.features.team.model.TeamUser
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.Repository
import org.springframework.data.repository.query.Param

interface PermissionRepository : Repository<TeamUser, String> {

    //region isUserPartOf ....
    @Query(
        """
        select count(tu)>0 from TeamUser tu where tu.id.user.id = :uId and tu.id.team.id = :oId
        """,
    )
    fun isPartOfByTeamId(
        @Param("uId") userId: String,
        @Param("oId") teamId: String
    ): Boolean

    // Soft delete entities can't be joined through parent list
    @Query(
        """
        select count(tu)>0 from Monitor m
        join m.team t
        join t.teamUsers tu
        where tu.id.user.id = :uId and m.id = :mId
        """,
    )
    fun isPartOfByMonitorId(
        @Param("uId") userId: String,
        @Param("mId") monitorId: String
    ): Boolean

    @Query(
        """
        select count(tu)>0 from TeamUser tu
        join tu.id.team t
        join t.monitors m
        join m.checkResults cr
        where tu.id.user.id = :uId and cr.id = :crId
        """,
    )
    fun isPartOfByCheckResultId(
        @Param("uId") userId: String,
        @Param("crId") checkResultId: String
    ): Boolean

    @Query(
        """
        select count(tu)>0 from NotificationMethod nm
        join nm.team t
        join t.teamUsers tu
        where tu.id.user.id = :uId and nm.id = :nmId
        """,
    )
    fun isPartOfByNotificationMethodId(
        @Param("uId") userId: String,
        @Param("nmId") notificationMethodId: String
    ): Boolean

    @Query(
        """
        select count(tu)>0 from StatusPage sp
        join sp.team t
        join t.teamUsers tu
        where tu.id.user.id = :uId and sp.id = :nmId
        """,
    )
    fun isPartOfByStatusPageId(
        @Param("uId") userId: String,
        @Param("spId") statusPageId: String
    ): Boolean

    @Query(
        """
        select count(tu)>0 from StatusPageGroup spg
        join spg.statusPage sp
        join sp.team t
        join t.teamUsers tu
        where tu.id.user.id = :uId and sp.id = :nmId
        """,
    )
    fun isPartOfByStatusPageGroupId(
        @Param("uId") userId: String,
        @Param("spId") statusPageId: String
    ): Boolean

    //endregion

    //region findByEntityId
    @Query(
        """
        select tu from TeamUser tu where tu.id.user.id = :uId and tu.id.team.id = :tId
        """,
    )
    fun findByTeamId(
        @Param("uId") userId: String,
        @Param("tId") teamId: String
    ): TeamUser?

    @Query(
        """
        select tu from Monitor m
        join m.team t
        join t.teamUsers tu
        where tu.id.user.id = :uId and m.id = :mId
        """,
    )
    fun findByMonitorId(
        @Param("uId") userId: String,
        @Param("mId") monitorId: String
    ): TeamUser?

    @Query(
        """
        select tu from TeamUser tu
        join tu.id.team t
        join t.monitors m
        join m.checkResults cr
        where tu.id.user.id = :uId and cr.id = :crId
        """,
    )
    fun findByCheckResultId(
        @Param("uId") userId: String,
        @Param("crId") checkResultId: String
    ): TeamUser?

    @Query(
        """
        select tu from NotificationMethod nm
        join nm.team t
        join t.teamUsers tu
        where tu.id.user.id = :uId and nm.id = :nmId
        """,
    )
    fun findByNotificationMethodId(
        @Param("uId") userId: String,
        @Param("nmId") notificationMethodId: String
    ): TeamUser?

    @Query(
        """
        select tu from StatusPage sp
        join sp.team t
        join t.teamUsers tu
        where tu.id.user.id = :uId and sp.id = :nmId
        """,
    )
    fun findByStatusPageId(
        @Param("uId") userId: String,
        @Param("spId") statusPageId: String
    ): TeamUser?

    @Query(
        """
        select tu from StatusPageGroup spg
        join spg.statusPage sp
        join sp.team t
        join t.teamUsers tu
        where tu.id.user.id = :uId and sp.id = :nmId
        """,
    )
    fun findByStatusPageGroupId(
        @Param("uId") userId: String,
        @Param("spId") statusPageId: String
    ): TeamUser?

    //endregion
}

//region isUserPartOfBy ... AndRole
fun PermissionRepository.isPartOfByTeamIdAndRole(
    userId: String,
    teamId: String,
    role: TeamRole
) = (findByTeamId(userId, teamId)?.role == role)

fun PermissionRepository.isPartOfByMonitorIdAndRole(
    userId: String,
    monitorId: String,
    role: TeamRole
) = (findByMonitorId(userId, monitorId)?.role == role)

fun PermissionRepository.isPartOfByCheckResultIdAndRole(
    userId: String,
    checkResultId: String,
    role: TeamRole
) = (findByCheckResultId(userId, checkResultId)?.role == role)

fun PermissionRepository.isPartOfByNotificationMethodIdAndRole(
    userId: String,
    notificationMethodId: String,
    role: TeamRole
) = (findByNotificationMethodId(userId, notificationMethodId)?.role == role)

fun PermissionRepository.isPartOfByStatusPageAndRole(
    userId: String,
    statusPageId: String,
    role: TeamRole
) = (findByStatusPageId(userId, statusPageId)?.role == role)

fun PermissionRepository.isPartOfByStatusPageGroupAndRole(
    userId: String,
    statusPageGroupId: String,
    role: TeamRole
) = (findByStatusPageGroupId(userId, statusPageGroupId)?.role == role)

//endregion

//region isUserAdminOf
fun PermissionRepository.isAdminOfByTeamId(
    userId: String,
    teamId: String
) = isPartOfByTeamIdAndRole(userId, teamId, TeamRole.ADMIN)

fun PermissionRepository.isAdminOfByMonitorId(
    userId: String,
    monitorId: String
) = isPartOfByMonitorIdAndRole(userId, monitorId, TeamRole.ADMIN)

fun PermissionRepository.isAdminOfByCheckResultId(
    userId: String,
    checkResultId: String
) = isPartOfByCheckResultIdAndRole(userId, checkResultId, TeamRole.ADMIN)

fun PermissionRepository.isAdminOfByNotificationMethodId(
    userId: String,
    notificationMethodId: String
) = isPartOfByNotificationMethodIdAndRole(userId, notificationMethodId, TeamRole.ADMIN)

fun PermissionRepository.isAdminOfByStatusPageId(
    userId: String,
    statusPageId: String
) = isPartOfByStatusPageAndRole(userId, statusPageId, TeamRole.ADMIN)

fun PermissionRepository.isAdminOfByStatusPageGroupId(
    userId: String,
    statusPageGroupId: String
) = isPartOfByStatusPageGroupAndRole(userId, statusPageGroupId, TeamRole.ADMIN)

//endregion

fun PermissionRepository.isPartOfByTeamIds(
    userId: String,
    teamIds: Collection<String>
): Boolean = teamIds.all { isPartOfByTeamId(userId, it) }

fun PermissionRepository.isPartOfByNotificationMethodIds(
    userId: String,
    notificationMethodIds: Collection<String>
): Boolean = notificationMethodIds.all { isPartOfByNotificationMethodId(userId, it) }

fun PermissionRepository.isPartOfByStatusPageGroupIds(
    userId: String,
    statusPageGroupIds: Collection<String>
): Boolean = statusPageGroupIds.all { isPartOfByStatusPageGroupId(userId, it) }

fun User.throwIfNotPartOf(checker: () -> Boolean) {
    if (!isAdmin() && !checker()) {
        throw ForbiddenException()
    }
}
