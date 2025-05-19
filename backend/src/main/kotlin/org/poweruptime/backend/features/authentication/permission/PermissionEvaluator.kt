package org.poweruptime.backend.features.authentication.permission

import org.poweruptime.backend.features.authentication.domain.*
import org.poweruptime.backend.features.authentication.model.SystemRole
import org.slf4j.Logger
import org.slf4j.LoggerFactory.getLogger
import org.springframework.security.access.PermissionEvaluator
import org.springframework.security.core.Authentication
import org.springframework.stereotype.Component
import java.io.Serializable

@Component
class PermissionEvaluator(val permissionRepository: PermissionRepository) : PermissionEvaluator {
    private final val logger: Logger = getLogger(PermissionEvaluator::class.java)

    override fun hasPermission(
        authentication: Authentication,
        targetEntityId: Any,
        permissionName: Any
    ): Boolean {
        if (authentication.authorities.any { it.authority == SystemRole.ADMIN.grantedAuthority.authority }) {
            return true
        }

        if (permissionName !is String || targetEntityId !is String) {
            logger.warn(
                "Error permission no string or targetEntityId no long: {}, targetEntityId: {}",
                permissionName,
                targetEntityId,
            )
            return false
        }

        val parsedPermission = Permission.entries.find { it.permissionName == permissionName } ?: run {
            logger.error("Error unknown permission: {}", permissionName)

            return false
        }

        val userId = authentication.name

        return checkPermission(parsedPermission, userId, targetEntityId).apply {
            logger.debug(
                "Checker: '{}' user: '{}' value: '{}' result: {}",
                permissionName,
                userId,
                targetEntityId,
                this,
            )
        }
    }

    override fun hasPermission(
        authentication: Authentication?,
        targetId: Serializable?,
        targetType: String?,
        permission: Any?
    ): Boolean {
        return false
    }

    fun checkPermission(permission: Permission, userId: String, targetEntityId: String): Boolean = when (permission) {
        Permission.TeamAdmin -> permissionRepository.isAdminOfByTeamId(
            userId,
            targetEntityId,
        )
        Permission.TeamMember -> permissionRepository.isPartOfByTeamId(
            userId,
            targetEntityId,
        )
        Permission.MonitorAdmin -> permissionRepository.isAdminOfByMonitorId(
            userId,
            targetEntityId,
        )
        Permission.MonitorMember -> permissionRepository.isPartOfByMonitorId(
            userId,
            targetEntityId,
        )
        Permission.CheckResultAdmin -> permissionRepository.isAdminOfByCheckResultId(
            userId,
            targetEntityId,
        )
        Permission.CheckResultMember -> permissionRepository.isPartOfByCheckResultId(
            userId,
            targetEntityId,
        )
        Permission.NotificationMethodAdmin -> permissionRepository.isAdminOfByNotificationMethodId(
            userId,
            targetEntityId,
        )
        Permission.NotificationMethodMember -> permissionRepository.isPartOfByNotificationMethodId(
            userId,
            targetEntityId,
        )
        Permission.NotificationAdmin -> permissionRepository.isAdminOfByNotificationId(
            userId,
            targetEntityId,
        )
        Permission.NotificationMember -> permissionRepository.isPartOfByNotificationId(
            userId,
            targetEntityId,
        )
        Permission.StatusPageAdmin -> permissionRepository.isAdminOfByStatusPageId(
            userId,
            targetEntityId,
        )
        Permission.StatusPageMember -> permissionRepository.isPartOfByStatusPageId(
            userId,
            targetEntityId,
        )
        Permission.StatusPageGroupAdmin -> permissionRepository.isAdminOfByStatusPageGroupId(
            userId,
            targetEntityId,
        )
        Permission.StatusPageGroupMember -> permissionRepository.isPartOfByStatusPageGroupId(
            userId,
            targetEntityId,
        )
    }
}
