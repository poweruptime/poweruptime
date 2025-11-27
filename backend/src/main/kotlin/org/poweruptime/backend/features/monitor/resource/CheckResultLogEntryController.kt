package org.poweruptime.backend.features.monitor.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.REQUIRED_AUTH
import org.poweruptime.backend.core.SYSTEM_ROLE_ADMIN
import org.poweruptime.backend.core.dto.Pageable
import org.poweruptime.backend.core.dto.PaginatedResponse
import org.poweruptime.backend.core.dto.toDto
import org.poweruptime.backend.features.authentication.permission.CHECK_RESULT_MEMBER
import org.poweruptime.backend.features.authentication.permission.TEAM_MEMBER
import org.poweruptime.backend.features.monitor.dto.CheckResultLogEntryResponse
import org.poweruptime.backend.features.monitor.model.CheckResultLogStage
import org.poweruptime.backend.features.monitor.service.CheckResultLogEntryService
import org.poweruptime.backend.features.monitor.service.CheckResultService
import org.springdoc.core.annotations.ParameterObject
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/check-result/{checkResultId}/log")
@Tag(name = "Check Result API")
class CheckResultLogEntryController(
    private val checkResultLogEntryService: CheckResultLogEntryService,
    private val checkResultService: CheckResultService,
) {
    @Operation(
        summary = "Get check result logs",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_MEMBER",
    )
    @PreAuthorize("hasPermission(#publicCheckResultId, '$CHECK_RESULT_MEMBER')")
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    fun getAll(
        @ParameterObject pageable: Pageable,
        @PathVariable("checkResultId") publicCheckResultId: String,
        @RequestParam("stages") stage: List<CheckResultLogStage>? = null,
    ): PaginatedResponse<CheckResultLogEntryResponse> = checkResultLogEntryService.getAllPaginated(
        pageable = pageable,
        checkResultId = checkResultService.getIdByPublicId(publicCheckResultId),
        stages = stage,
    ).toDto {
        CheckResultLogEntryResponse(it)
    }
}
