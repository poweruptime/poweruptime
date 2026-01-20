package org.poweruptime.backend.features.user.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.REQUIRED_AUTH
import org.poweruptime.backend.core.SYSTEM_ROLE_ADMIN
import org.poweruptime.backend.core.dto.Pageable
import org.poweruptime.backend.core.dto.PaginatedResponse
import org.poweruptime.backend.core.dto.toDto
import org.poweruptime.backend.features.authentication.model.SystemRole
import org.poweruptime.backend.features.authentication.service.user
import org.poweruptime.backend.features.user.CreateUserDto
import org.poweruptime.backend.features.user.UpdateUserDto
import org.poweruptime.backend.features.user.UserResponse
import org.poweruptime.backend.features.user.service.UserService
import org.springdoc.core.annotations.ParameterObject
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/user")
@Tag(name = "User API")
class UserController(val userService: UserService) {
    @Operation(
        summary = "Get user",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.OK)
    @GetMapping("/{id}")
    fun get(@PathVariable("id") publicId: String): UserResponse =
        UserResponse(userService.getById(userService.getIdByPublicId(publicId)))

    @Operation(
        summary = "Get all users",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.OK)
    @GetMapping
    fun getAll(
        @ParameterObject pageable: Pageable,
        @RequestParam("search") search: String?,
        @RequestParam("activated") activated: Boolean?,
        @RequestParam("role") role: SystemRole?,
    ): PaginatedResponse<UserResponse> = userService
        .getAll(
            pageable = pageable,
            search = search,
            activated = activated,
            role = role,
        ).toDto { UserResponse(it) }

    @Operation(
        summary = "Create user",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping
    fun create(auth: Authentication, @RequestBody @Valid dto: CreateUserDto): UserResponse = UserResponse(
        userService.create(dto, auth.user()),
    )

    @Operation(
        summary = "Update user",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping
    @ResponseStatus(HttpStatus.OK)
    fun update(auth: Authentication, @RequestBody @Valid dto: UpdateUserDto) = UserResponse(
        userService.update(dto, auth.user()),
    )

//    @Operation(
//        summary = "Delete a user by id",
//        security = [SecurityRequirement(name = BEARER_AUTH)],
//        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
//    )
//    @PreAuthorize("hasRole('ADMIN')")
//    @DeleteMapping("/{id}")
//    @ResponseStatus(HttpStatus.OK)
//    fun delete(@PathVariable("id") publicId: String) {
//        userService.deleteById(userService.getIdByPublicId(publicId))
//    }
}
