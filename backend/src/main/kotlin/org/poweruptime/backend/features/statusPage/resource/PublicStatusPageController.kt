package org.poweruptime.backend.features.statusPage.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.poweruptime.backend.core.dto.PaginatedResponse
import org.poweruptime.backend.core.dto.toDto
import org.poweruptime.backend.core.utils.orThrowNotFound
import org.poweruptime.backend.features.monitor.core.TimeOption
import org.poweruptime.backend.features.monitor.dto.PublicMonitorMinResponse
import org.poweruptime.backend.features.monitor.service.CheckResultService
import org.poweruptime.backend.features.monitor.service.MonitorService
import org.poweruptime.backend.features.monitor.service.myFormat
import org.poweruptime.backend.features.statusPage.dto.PublicStatusPageResponse
import org.poweruptime.backend.features.statusPage.service.StatusPageService
import org.springdoc.core.annotations.ParameterObject
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/public/status-page")
@Tag(name = "Public Status Page API")
class PublicStatusPageController(
    private val statusPageService: StatusPageService,
    private val monitorService: MonitorService,
    private val checkResultService: CheckResultService,
) {
    @Operation(
        summary = "Get status page",
    )
    @GetMapping("/{slug}")
    @ResponseStatus(HttpStatus.OK)
    fun get(@PathVariable slug: String): PublicStatusPageResponse =
        statusPageService.getBySlug(slug)?.let {
            PublicStatusPageResponse(it)
        }.orThrowNotFound("Status page not found")

    @Operation(
        summary = "Get slug by domain",
    )
    @GetMapping("/byDomain/{domain}")
    @ResponseStatus(HttpStatus.OK)
    fun getByDomain(@PathVariable domain: String): PublicStatusPageResponse =
        statusPageService.getByDomainName(domain)?.let {
            PublicStatusPageResponse(it)
        }.orThrowNotFound("Status page not found")

    @Operation(
        summary = "Get all monitors",
    )
    @GetMapping("/{slug}/monitor")
    @ResponseStatus(HttpStatus.OK)
    fun getAllByStatusPage(
        @ParameterObject @PageableDefault pageable: Pageable,
        @PathVariable("slug") statusPageSlug: String,
        @RequestParam("usedInStatusPageGroupIds") usedInStatusPageGroupIds: Set<String>?,
    ): PaginatedResponse<PublicMonitorMinResponse> =
        monitorService.getAllPaginated(
            pageable = pageable,
            statusPageSlug = statusPageSlug,
            usedInStatusPageGroupIds = usedInStatusPageGroupIds?.toList(),
        ).toDto {
            PublicMonitorMinResponse(
                monitor = it,
                oneDayUptime = checkResultService.calculateRecentUptimeByMonitorId(
                    it.id,
                    TimeOption.ONE_DAY,
                ).myFormat(),
                lastCheckResults = checkResultService.getLastByMonitorId(it.id, 35),
            )
        }
}
