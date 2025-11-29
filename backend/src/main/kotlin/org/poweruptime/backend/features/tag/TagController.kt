package org.poweruptime.backend.features.tag

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.REQUIRED_AUTH
import org.poweruptime.backend.core.SYSTEM_ROLE_ADMIN
import org.poweruptime.backend.core.dto.Pageable
import org.poweruptime.backend.core.dto.PaginatedResponse
import org.poweruptime.backend.core.dto.toDto
import org.poweruptime.backend.features.authentication.domain.PermissionsService
import org.poweruptime.backend.features.authentication.domain.throwIfNotPartOf
import org.poweruptime.backend.features.authentication.permission.*
import org.poweruptime.backend.features.authentication.service.userId
import org.poweruptime.backend.features.team.service.TeamService
import org.springdoc.core.annotations.ParameterObject
import org.springframework.http.HttpStatus
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/tag")
@Tag(name = "Tag API")
class TagController(
    private val tagService: TagService,
    private val teamService: TeamService,
    private val permissionsService: PermissionsService,
) {
    @Operation(
        summary = "Get tags",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_MEMBER",
    )
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    fun getAll(
        auth: Authentication,
        @ParameterObject pageable: Pageable,
        @RequestParam("teamId") publicTeamId: String?,
        @RequestParam("name") name: String?,
    ): PaginatedResponse<TagDto> {
        publicTeamId?.let { publicTeamId ->
            auth.throwIfNotPartOf { publicUserId ->
                permissionsService.isPartOfByTeamId(publicUserId, publicTeamId)
            }
        }

        return tagService.getAllPaginated(
            pageable = pageable,
            teamId = publicTeamId?.let { teamService.getIdByPublicId(it) },
            userId = if (publicTeamId == null) auth.userId() else null,
            name = name,
        ).toDto {
            TagDto(it)
        }
    }
}
