package org.poweruptime.backend.features.instanceSetting

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.REQUIRED_AUTH
import org.poweruptime.backend.core.SYSTEM_ROLE_ADMIN
import org.poweruptime.backend.core.exceptions.NotFoundException
import org.poweruptime.backend.features.authentication.permission.TEAM_ADMIN
import org.poweruptime.backend.features.info.SupporterService
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.time.ZoneId

@RestController
@RequestMapping("/v1/instance-settings")
@Tag(name = "Instance Setting API")
class InstanceSettingController(
    private val instanceSettingService: InstanceSettingService,
    private val supporterService: SupporterService,
) {
    @Operation(
        summary = "Get instance settings",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN | $TEAM_ADMIN",
    )
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    fun getSettings(): InstanceSettingsResponse = InstanceSettingsResponse(
        supportLookup = instanceSettingService.getSupportLookup(),
        timezone = instanceSettingService.getTimeZone().id,
        isUserAllowedToCreateTeams = instanceSettingService.getUserAllowedToCreateTeams(),
        checkResultRetentionPeriodInDays = instanceSettingService.getCheckResultRetentionPeriodInDays(),
        checkResultLogRetentionPeriodInDays = instanceSettingService.getCheckResultLogRetentionPeriodInDays(),
        showSupportBadge = instanceSettingService.getShowSupportBadge(),
    )

    @Operation(
        summary = "Get instance timezones",
        security = [SecurityRequirement(name = BEARER_AUTH)],
    )
    @GetMapping("timezones")
    @ResponseStatus(HttpStatus.OK)
    fun getAvailableTimezones(): InstanceAvailableTimezonesResponse = InstanceAvailableTimezonesResponse(
        availableTimezones = ZoneId.getAvailableZoneIds(),
    )

    @Operation(
        summary = "Set timezone instance setting",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("timezone")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun setTimeZone(
        @RequestBody @Valid dto: SettingStringSetDto
    ): InstanceSettingsResponse {
        if (!ZoneId.getAvailableZoneIds().contains(dto.value)) {
            throw NotFoundException("ZoneId not found")
        }
        instanceSettingService.setTimeZone(ZoneId.of(dto.value))

        return getSettings()
    }

    @Operation(
        summary = "Set support lookup instance setting",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("supportLookup")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun setSupportLookup(
        @RequestBody @Valid dto: SettingNullableStringSetDto
    ): InstanceSettingsResponse {
        instanceSettingService.setSupportLookup(dto.value)

        if (dto.value.isNullOrBlank()) {
            instanceSettingService.setSupportSince(null)
        } else {
            supporterService.check()
        }

        return getSettings()
    }

    @Operation(
        summary = "Set showSupportBadge instance setting",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("showSupportBadge")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun setShowSupportBadge(
        @RequestBody @Valid dto: SettingBooleanSetDto
    ): InstanceSettingsResponse {
        instanceSettingService.setShowSupportBadge(dto.value)

        return getSettings()
    }

    @Operation(
        summary = "Set isUserAllowedToCreateTeams instance setting",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("isUserAllowedToCreateTeams")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun setIsUserAllowedToCreateTeams(
        @RequestBody @Valid dto: SettingBooleanSetDto
    ): InstanceSettingsResponse {
        instanceSettingService.setUserAllowedToCreateTeams(dto.value)

        return getSettings()
    }

    @Operation(
        summary = "Set checkResultRetentionPeriodInDays instance setting",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("checkResultRetentionPeriodInDays")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun setCheckResultRetentionPeriodInDays(
        @RequestBody @Valid dto: SettingIntSetDto
    ): InstanceSettingsResponse {
        instanceSettingService.setCheckResultRetentionPeriodInDays(dto.value)

        return getSettings()
    }

    @Operation(
        summary = "Set checkResultLogRetentionPeriodInDays instance setting",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("checkResultLogRetentionPeriodInDays")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun setCheckResultLogRetentionPeriodInDays(
        @RequestBody @Valid dto: SettingIntSetDto
    ): InstanceSettingsResponse {
        instanceSettingService.setCheckResultLogRetentionPeriodInDays(dto.value)

        return getSettings()
    }
}
