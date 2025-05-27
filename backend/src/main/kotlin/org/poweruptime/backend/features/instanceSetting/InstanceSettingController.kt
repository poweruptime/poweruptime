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
import org.poweruptime.backend.features.info.supporter.SupporterService
import org.poweruptime.backend.features.info.versionChecker.VersionChecker
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
    private val versionChecker: VersionChecker,
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
        versionCheckEnabled = instanceSettingService.getVersionCheckEnabled(),
        versionCheckAdminMailEnabled = instanceSettingService.getVersionCheckAdminMailEnabled(),
        versionCheckAdminMailTo = instanceSettingService.getVersionCheckAdminMailTo(),
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
        summary = "Set support instance setting",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("support")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun setSupport(
        @RequestBody @Valid dto: InstanceSettingSupportDto
    ): InstanceSupportSettingsResponse {
        instanceSettingService.setSupportLookup(dto.supportLookup)
        instanceSettingService.setShowSupportBadge(dto.showSupportBadge)

        val check = if (dto.supportLookup.isNullOrBlank()) {
            instanceSettingService.setSupportSince(null)
            false
        } else {
            supporterService.check(dto.supportLookup)
        }

        return InstanceSupportSettingsResponse(
            check,
            getSettings(),
        )
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
        summary = "Set retention instance setting",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("retention")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun setRetention(
        @RequestBody @Valid dto: InstanceSettingRetentionDto
    ): InstanceSettingsResponse {
        instanceSettingService.setCheckResultRetentionPeriodInDays(dto.checkResultRetentionPeriodInDays)
        instanceSettingService.setCheckResultLogRetentionPeriodInDays(dto.checkResultLogRetentionPeriodInDays)

        return getSettings()
    }

    @Operation(
        summary = "Set version check instance setting",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("versionCheck")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun setVersionCheck(
        @RequestBody @Valid dto: InstanceSettingVersionCheckDto
    ): InstanceSettingsResponse {
        instanceSettingService.setVersionCheckEnabled(dto.versionCheckEnabled)
        instanceSettingService.setVersionCheckAdminMailEnabled(dto.versionCheckAdminMailEnabled)
        instanceSettingService.setVersionCheckAdminMailTo(dto.versionCheckAdminMailTo)

        return getSettings()
    }

    @Operation(
        summary = "Get latest version",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("versionCheck")
    fun versionCheck(
        @RequestParam("skipCache") skipCache: Boolean = false
    ): VersionCheckResponse = VersionCheckResponse(
        versionChecker.checkForLatestVersion(skipCache),
    )
}
