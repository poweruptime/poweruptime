package org.poweruptime.backend.features.user.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.REQUIRED_AUTH
import org.poweruptime.backend.core.SYSTEM_ROLE_ADMIN
import org.poweruptime.backend.core.dto.IdResponse
import org.poweruptime.backend.core.dto.PaginatedResponse
import org.poweruptime.backend.core.dto.toDto
import org.poweruptime.backend.features.authentication.model.SystemRole
import org.poweruptime.backend.features.authentication.service.AuthService
import org.poweruptime.backend.features.user.dto.CreateUserDto
import org.poweruptime.backend.features.user.dto.UpdateUserDto
import org.poweruptime.backend.features.user.dto.UserResponse
import org.poweruptime.backend.features.user.service.UserService
import org.springdoc.core.annotations.ParameterObject
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/user")
@Tag(name = "User API")
class UserController(
    val userService: UserService,
    val authService: AuthService
) {

    @Operation(
        summary = "Create user",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping
    fun create(auth: Authentication, @RequestBody @Valid dto: CreateUserDto) = IdResponse(
        userService.create(dto, authService.getByAuthOrThrow(auth)),
    )

    @Operation(
        summary = "Get user",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.OK)
    @GetMapping("/{id}")
    fun get(@PathVariable id: String) = UserResponse(userService.getByIdOrThrow(id))

    @Operation(
        summary = "Get all users",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.OK)
    @GetMapping
    fun getAll(
        @ParameterObject @PageableDefault pageable: Pageable,
        @RequestParam("search") search: String?,
        @RequestParam("activated") activated: Boolean?,
        @RequestParam("role") role: SystemRole?,
    ): PaginatedResponse<UserResponse> = userService.getAllPaginated(
        pageable = pageable,
        search = search,
        activated = activated,
        role = role,
    ).toDto { UserResponse(it) }

    @Operation(
        summary = "Update user",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping
    @ResponseStatus(HttpStatus.OK)
    fun update(auth: Authentication, @RequestBody @Valid dto: UpdateUserDto) = IdResponse(
        userService.update(dto, authService.getByAuthOrThrow(auth)),
    )

    @Operation(
        summary = "Delete a user by id",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun delete(@PathVariable("id") id: String): Unit = userService.deleteByIdOrThrow(id)
}
