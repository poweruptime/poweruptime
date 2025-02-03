package org.poweruptime.backend.features.team.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.REQUIRED_AUTH
import org.poweruptime.backend.core.SYSTEM_ROLE_ADMIN
import org.poweruptime.backend.core.exceptions.NotFoundException
import org.poweruptime.backend.features.authentication.permission.TEAM_ADMIN
import org.poweruptime.backend.features.instanceSetting.SettingIntSetDto
import org.poweruptime.backend.features.instanceSetting.SettingStringSetDto
import org.poweruptime.backend.features.team.dto.TeamSettingsResponse
import org.poweruptime.backend.features.team.service.TeamSettingService
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.time.ZoneId

@RestController
@RequestMapping("/v1/team")
@Tag(name = "Team Setting API")
class TeamSettingController(
    private val teamSettingService: TeamSettingService
) {
    @Operation(
        summary = "Get settings from team",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_ADMIN",
    )
    @PreAuthorize("""hasPermission(#teamId, '$TEAM_ADMIN')""")
    @GetMapping("{teamId}/setting")
    @ResponseStatus(HttpStatus.OK)
    fun getSettings(@PathVariable("teamId") teamId: String) = TeamSettingsResponse(
        timezone = teamSettingService.getTimeZone(teamId).id,
        checkResultRetentionPeriodInDays = teamSettingService.getCheckResultRetentionPeriodInDays(teamId),
        checkResultLogRetentionPeriodInDays = teamSettingService.getCheckResultLogRetentionPeriodInDays(teamId),
    )

    @Operation(
        summary = "Set timezone setting for team",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_ADMIN",
    )
    @PreAuthorize("hasPermission(#teamId, '$TEAM_ADMIN')")
    @PutMapping("{teamId}/setting/timezone")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun setTimeZone(
        @PathVariable("teamId") teamId: String,
        @RequestBody @Valid dto: SettingStringSetDto
    ): TeamSettingsResponse {
        if (!ZoneId.getAvailableZoneIds().contains(dto.value)) {
            throw NotFoundException("ZoneId not found")
        }
        teamSettingService.setTimeZone(teamId, ZoneId.of(dto.value))

        return getSettings(teamId)
    }

    @Operation(
        summary = "Set checkResultRetentionPeriodInDays setting for team",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_ADMIN",
    )
    @PreAuthorize("hasPermission(#teamId, '$TEAM_ADMIN')")
    @PutMapping("{teamId}/setting/checkResultRetentionPeriodInDays")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun setCheckResultRetentionPeriodInDays(
        @PathVariable("teamId") teamId: String,
        @RequestBody @Valid dto: SettingIntSetDto
    ): TeamSettingsResponse {
        teamSettingService.setCheckResultRetentionPeriodInDays(teamId, dto.value)

        return getSettings(teamId)
    }

    @Operation(
        summary = "Set checkResultLogRetentionPeriodInDays setting for team",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_ADMIN",
    )
    @PreAuthorize("hasPermission(#teamId, '$TEAM_ADMIN')")
    @PutMapping("{teamId}/setting/checkResultLogRetentionPeriodInDays")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun setCheckResultLogRetentionPeriodInDays(
        @PathVariable("teamId") teamId: String,
        @RequestBody @Valid dto: SettingIntSetDto
    ): TeamSettingsResponse {
        teamSettingService.setCheckResultLogRetentionPeriodInDays(teamId, dto.value)

        return getSettings(teamId)
    }
}
