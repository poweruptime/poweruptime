package org.poweruptime.backend.features.authentication.permission

import io.github.oshai.kotlinlogging.KotlinLogging
import org.poweruptime.backend.features.authentication.domain.*
import org.poweruptime.backend.features.authentication.model.SystemRole
import org.poweruptime.backend.features.authentication.service.publicUserId
import org.springframework.security.access.PermissionEvaluator
import org.springframework.security.core.Authentication
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.io.Serializable

@Component
class PermissionEvaluator(
    private val permissionsService: PermissionsService,
) : PermissionEvaluator {
    private final val logger = KotlinLogging.logger {}

    override fun hasPermission(
        authentication: Authentication,
        publicTargetId: Any,
        permissionName: Any
    ): Boolean {
        if (authentication.authorities.any { it.authority == SystemRole.ADMIN.grantedAuthority.authority }) {
            return true
        }

        if (permissionName !is String || publicTargetId !is String) {
            logger.warn {
                """Permission or publicTargetId wasn't passed correctly: "$permissionName",""" +
                    """publicTargetId: "$publicTargetId""""
            }
            return false
        }

        val parsedPermission = Permission.entries.find { it.permissionName == permissionName } ?: run {
            logger.error { """Unknown permission: "$permissionName"""" }

            return false
        }

        val publicUserId = authentication.publicUserId()

        return checkPermission(parsedPermission, publicUserId, publicTargetId).apply {
            logger.debug {
                "Checker: '${parsedPermission.name}' user: '$publicUserId' target: '$publicTargetId' result: $this"
            }
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

    @Transactional(readOnly = true)
    fun checkPermission(
        permission: Permission,
        publicUserId: String,
        publicTargetId: String
    ): Boolean = when (permission) {
        Permission.TeamAdmin -> permissionsService.isAdminOfByTeamId(
            publicUserId,
            publicTargetId,
        )
        Permission.TeamMember -> permissionsService.isPartOfByTeamId(
            publicUserId,
            publicTargetId,
        )
        Permission.MonitorAdmin -> permissionsService.isAdminOfByMonitorId(
            publicUserId,
            publicTargetId,
        )
        Permission.MonitorMember -> permissionsService.isPartOfByMonitorId(
            publicUserId,
            publicTargetId,
        )
        Permission.CheckResultAdmin -> permissionsService.isAdminOfByCheckResultId(
            publicUserId,
            publicTargetId,
        )
        Permission.CheckResultMember -> permissionsService.isPartOfByCheckResultId(
            publicUserId,
            publicTargetId,
        )
        Permission.NotificationMethodAdmin -> permissionsService.isAdminOfByNotificationMethodId(
            publicUserId,
            publicTargetId,
        )
        Permission.NotificationMethodMember -> permissionsService.isPartOfByNotificationMethodId(
            publicUserId,
            publicTargetId,
        )
        Permission.NotificationAdmin -> permissionsService.isAdminOfByNotificationId(
            publicUserId,
            publicTargetId,
        )
        Permission.NotificationMember -> permissionsService.isPartOfByNotificationId(
            publicUserId,
            publicTargetId,
        )
        Permission.StatusPageAdmin -> permissionsService.isAdminOfByStatusPageId(
            publicUserId,
            publicTargetId,
        )
        Permission.StatusPageMember -> permissionsService.isPartOfByStatusPageId(
            publicUserId,
            publicTargetId,
        )
        Permission.StatusPageGroupAdmin -> permissionsService.isAdminOfByStatusPageGroupId(
            publicUserId,
            publicTargetId,
        )
        Permission.StatusPageGroupMember -> permissionsService.isPartOfByStatusPageGroupId(
            publicUserId,
            publicTargetId,
        )
    }
}
