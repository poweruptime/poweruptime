package org.poweruptime.backend.features.info.instanceSetting

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.REQUIRED_AUTH
import org.poweruptime.backend.core.SYSTEM_ROLE_ADMIN
import org.poweruptime.backend.core.exceptions.NotFoundException
import org.poweruptime.backend.features.info.dto.SettingBooleanDto
import org.poweruptime.backend.features.info.dto.SettingStringDto
import org.poweruptime.backend.features.info.instanceSetting.dto.InstanceAvailableTimezonesResponse
import org.poweruptime.backend.features.info.instanceSetting.dto.InstanceSettingSupportDto
import org.poweruptime.backend.features.info.instanceSetting.dto.InstanceSettingVersionCheckDto
import org.poweruptime.backend.features.info.instanceSetting.dto.InstanceSettingsResponse
import org.poweruptime.backend.features.info.instanceSetting.dto.InstanceSupportSettingsResponse
import org.poweruptime.backend.features.info.instanceSetting.dto.SettingRetentionDto
import org.poweruptime.backend.features.info.instanceSetting.dto.TimezoneInfo
import org.poweruptime.backend.features.info.supporter.SupporterService
import org.poweruptime.backend.features.info.versionChecker.dto.VersionCheckResponse
import org.poweruptime.backend.features.info.versionChecker.service.VersionChecker
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.time.ZoneId
import java.time.ZonedDateTime

@Tag(name = "Instance Setting API")
@RestController
@RequestMapping("/v1/instance-settings")
@PreAuthorize("hasRole('ADMIN')")
class InstanceSettingController(
    private val instanceSettingService: InstanceSettingService,
    private val supporterService: SupporterService,
    private val versionChecker: VersionChecker,
) {
    @Operation(
        summary = "Get instance settings",
        security = [SecurityRequirement(name = BEARER_AUTH)],
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
        showNewVersionDialog = instanceSettingService.getShowNewVersionDialog(),
        trustOAuthProviderMFA = instanceSettingService.getTrustOAuthProviderMFA(),
    )

    @Operation(
        summary = "Get instance timezones",
        security = [SecurityRequirement(name = BEARER_AUTH)],
    )
    @GetMapping("timezones")
    @ResponseStatus(HttpStatus.OK)
    fun getAvailableTimezones(): InstanceAvailableTimezonesResponse {
        val now = ZonedDateTime.now()
        val timezones = ZoneId
            .getAvailableZoneIds()
            .map { zoneIdStr ->
                val zoneId = ZoneId.of(zoneIdStr)
                val offset = now.withZoneSameInstant(zoneId).offset
                TimezoneInfo(
                    id = zoneIdStr,
                    offset = offset.toString().let {
                        if (it == "Z") {
                            "00:00"
                        } else {
                            it
                        }
                    },
                )
            }

        return InstanceAvailableTimezonesResponse(availableTimezones = timezones)
    }

    @Operation(
        summary = "Set timezone instance setting",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PutMapping("timezone")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun setTimeZone(@RequestBody @Valid dto: SettingStringDto): InstanceSettingsResponse {
        if (!ZoneId.getAvailableZoneIds().contains(dto.it)) {
            throw NotFoundException("ZoneId not found")
        }
        instanceSettingService.setTimeZone(ZoneId.of(dto.it))

        return getSettings()
    }

    @Operation(
        summary = "Set support instance setting",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PutMapping("support")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun setSupport(@RequestBody @Valid dto: InstanceSettingSupportDto): InstanceSupportSettingsResponse {
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
    @PutMapping("isUserAllowedToCreateTeams")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun setIsUserAllowedToCreateTeams(@RequestBody @Valid dto: SettingBooleanDto): InstanceSettingsResponse {
        instanceSettingService.setUserAllowedToCreateTeams(dto.it)

        return getSettings()
    }

    @Operation(
        summary = "Set trustOAuthProviderMFA instance setting",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PutMapping("trustOAuthProviderMFA")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun setTrustOAuthProviderMFA(@RequestBody @Valid dto: SettingBooleanDto): InstanceSettingsResponse {
        instanceSettingService.setTrustOAuthProviderMFA(dto.it)

        return getSettings()
    }

    @Operation(
        summary = "Set showNewVersionDialog instance setting",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PutMapping("showNewVersionDialog")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun setShowNewVersionDialog(@RequestBody @Valid dto: SettingBooleanDto): InstanceSettingsResponse {
        instanceSettingService.setShowNewVersionDialog(dto.it)

        return getSettings()
    }

    @Operation(
        summary = "Set retention instance setting",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PutMapping("retention")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun setRetention(@RequestBody @Valid dto: SettingRetentionDto): InstanceSettingsResponse {
        instanceSettingService.setCheckResultRetentionPeriodInDays(dto.checkResultRetentionPeriodInDays)
        instanceSettingService.setCheckResultLogRetentionPeriodInDays(dto.checkResultLogRetentionPeriodInDays)

        return getSettings()
    }

    @Operation(
        summary = "Set version check instance setting",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @PutMapping("versionCheck")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun setVersionCheck(@RequestBody @Valid dto: InstanceSettingVersionCheckDto): InstanceSettingsResponse {
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
    @GetMapping("versionCheck")
    fun versionCheck(@RequestParam("skipCache") skipCache: Boolean = false): VersionCheckResponse? =
        versionChecker.checkForLatestVersion(skipCache)
}
