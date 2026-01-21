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
import org.poweruptime.backend.features.info.dto.SettingStringDto
import org.poweruptime.backend.features.info.instanceSetting.dto.SettingRetentionDto
import org.poweruptime.backend.features.team.dto.TeamSettingsResponse
import org.poweruptime.backend.features.team.service.TeamService
import org.poweruptime.backend.features.team.service.TeamSettingService
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.time.ZoneId

@RestController
@RequestMapping("/v1/team")
@Tag(name = "Team Setting API")
class TeamSettingController(private val teamService: TeamService, private val teamSettingService: TeamSettingService) {
    @Operation(
        summary = "Get settings from team",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_ADMIN",
    )
    @PreAuthorize("""hasPermission(#publicTeamId, '$TEAM_ADMIN')""")
    @GetMapping("{teamId}/setting")
    @ResponseStatus(HttpStatus.OK)
    fun getSettings(@PathVariable("teamId") publicTeamId: String) =
        getSettings(teamService.getIdByPublicId(publicTeamId))

    private fun getSettings(teamId: ULong): TeamSettingsResponse = TeamSettingsResponse(
        timezone = teamSettingService.getTimeZone(teamId).id,
        checkResultRetentionPeriodInDays = teamSettingService.getCheckResultRetentionPeriodInDays(teamId),
        checkResultLogRetentionPeriodInDays = teamSettingService.getCheckResultLogRetentionPeriodInDays(teamId),
    )

    @Operation(
        summary = "Set timezone setting for team",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_ADMIN",
    )
    @PreAuthorize("hasPermission(#publicTeamId, '$TEAM_ADMIN')")
    @PutMapping("{teamId}/setting/timezone")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun setTimeZone(
        @PathVariable("teamId") publicTeamId: String,
        @RequestBody @Valid dto: SettingStringDto,
    ): TeamSettingsResponse {
        if (!ZoneId.getAvailableZoneIds().contains(dto.it)) {
            throw NotFoundException("ZoneId not found")
        }
        val teamId = teamService.getIdByPublicId(publicTeamId)
        teamSettingService.setTimeZone(teamId, ZoneId.of(dto.it))

        return getSettings(teamId)
    }

    @Operation(
        summary = "Set retention setting for team",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_ADMIN",
    )
    @PreAuthorize("hasPermission(#publicTeamId, '$TEAM_ADMIN')")
    @PutMapping("{teamId}/setting/retention")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun setRetention(
        @PathVariable("teamId") publicTeamId: String,
        @RequestBody @Valid dto: SettingRetentionDto,
    ): TeamSettingsResponse {
        val teamId = teamService.getIdByPublicId(publicTeamId)

        teamSettingService.setCheckResultRetentionPeriodInDays(teamId, dto.checkResultRetentionPeriodInDays)
        teamSettingService.setCheckResultLogRetentionPeriodInDays(teamId, dto.checkResultLogRetentionPeriodInDays)

        return getSettings(teamId)
    }
}
