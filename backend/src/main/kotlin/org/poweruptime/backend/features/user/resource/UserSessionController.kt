package org.poweruptime.backend.features.user.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.REQUIRED_AUTH
import org.poweruptime.backend.core.SYSTEM_ROLE_ADMIN
import org.poweruptime.backend.core.dto.Pageable
import org.poweruptime.backend.core.dto.PaginatedResponse
import org.poweruptime.backend.core.dto.toDto
import org.poweruptime.backend.features.authentication.SessionResponse
import org.poweruptime.backend.features.authentication.service.SessionService
import org.poweruptime.backend.features.user.service.UserService
import org.springdoc.core.annotations.ParameterObject
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/user/session")
@Tag(name = "User Session API")
class UserSessionController(
    val sessionService: SessionService,
    val userService: UserService,
) {

    @Operation(
        summary = "Get sessions of user",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    fun getSessions(
        @ParameterObject pageable: Pageable,
        @RequestParam("userId") userId: String,
    ): PaginatedResponse<SessionResponse> = sessionService.getAllPaginated(
        pageable = pageable,
        userId = userService.getIdByPublicId(userId),
    ).toDto { SessionResponse(it) }

    @Operation(
        summary = "Invalidate session of user",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun deleteSession(@PathVariable("id") publicId: String): Unit = sessionService.invalidateSessionByPublicId(publicId)
}
