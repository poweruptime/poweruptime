package org.poweruptime.backend.features.authentication.permission

import io.github.oshai.kotlinlogging.KotlinLogging
import org.poweruptime.backend.features.authentication.model.SystemRole
import org.poweruptime.backend.features.authentication.service.publicUserId
import org.springframework.security.access.PermissionEvaluator
import org.springframework.security.core.Authentication
import org.springframework.stereotype.Component
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

        val permissionRequest = Permission.fromPermissionName(permissionName)
        if (permissionRequest == null) {
            logger.error { """Unknown permission: "$permissionName"""" }
            return false
        }

        val publicUserId = authentication.publicUserId()

        return permissionsService.checkPermission(
            publicUserId,
            publicTargetId,
            permissionRequest,
        ).apply {
            logger.debug {
                "Checker: '${permissionRequest.permissionName}' " +
                    "user: '$publicUserId' target: '$publicTargetId' result: $this"
            }
        }
    }

    override fun hasPermission(
        authentication: Authentication,
        targetId: Serializable,
        targetType: String,
        permission: Any
    ): Boolean = false
}
