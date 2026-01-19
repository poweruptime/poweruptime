package org.poweruptime.backend.features.authentication.permission

import org.jetbrains.exposed.v1.jdbc.Query
import org.poweruptime.backend.core.exceptions.ForbiddenException
import org.poweruptime.backend.features.authentication.service.isAdmin
import org.poweruptime.backend.features.authentication.service.publicUserId
import org.poweruptime.backend.features.team.model.TeamRole
import org.poweruptime.backend.features.team.model.TeamUser
import org.springframework.security.core.Authentication
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class PermissionsService {
    fun isPartOf(
        publicUserId: String,
        entityId: String,
        permission: Permission
    ): Boolean = permission.buildQuery(publicUserId, entityId).limit(1).count() > 0

    fun find(
        publicUserId: String,
        entityId: String,
        permission: Permission
    ): TeamRole? = permission.buildQuery(publicUserId, entityId).limit(1)
        .firstOrNull()
        ?.let { it[TeamUser.role] }

    fun hasRole(
        publicUserId: String,
        entityId: String,
        permission: Permission,
        role: TeamRole
    ): Boolean = find(publicUserId, entityId, permission) == role

    fun isPartOfByIds(
        publicUserId: String,
        entityIds: Collection<String>,
        permission: Permission
    ): Boolean = entityIds.all { isPartOf(publicUserId, it, permission) }

    fun isAdminOfByIds(
        publicUserId: String,
        entityIds: Collection<String>,
        permission: Permission
    ): Boolean = entityIds.all {
        hasRole(publicUserId, it, permission, TeamRole.ADMIN)
    }

    fun checkPermission(
        publicUserId: String,
        entityId: String,
        permissionRequest: PermissionRequest
    ): Boolean = when (permissionRequest.requiredRole) {
        TeamRole.ADMIN -> hasRole(
            publicUserId,
            entityId,
            permissionRequest.permission,
            TeamRole.ADMIN
        )
        TeamRole.MEMBER, null -> isPartOf(publicUserId, entityId, permissionRequest.permission)
    }
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
