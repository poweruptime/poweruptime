package org.poweruptime.backend.features.statusPage.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.poweruptime.backend.core.utils.orThrowNotFound
import org.poweruptime.backend.features.monitor.core.TimeOption
import org.poweruptime.backend.features.monitor.dto.PublicMonitorMinResponse
import org.poweruptime.backend.features.monitor.service.CheckResultStatisticsService
import org.poweruptime.backend.features.monitor.service.myFormat
import org.poweruptime.backend.features.statusPage.domain.findByStatusPage
import org.poweruptime.backend.features.statusPage.dto.PublicStatusPageResponse
import org.poweruptime.backend.features.statusPage.model.StatusPageGroup
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupMonitor
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupRecord
import org.poweruptime.backend.features.statusPage.service.StatusPageService
import org.springframework.http.HttpStatus
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/public/status-page")
@Tag(name = "Public Status Page API")
@Transactional(readOnly = true)
class PublicStatusPageController(
    private val statusPageService: StatusPageService,
    private val checkResultStatisticsService: CheckResultStatisticsService,
) {

    private fun getStatusPageGroupsMonitorsAndCheckResults(
        statusPageId: ULong
    ): List<Pair<StatusPageGroupRecord, List<PublicMonitorMinResponse>>> {
        val groups = StatusPageGroup.findByStatusPage(statusPageId)
        val monitors = StatusPageGroupMonitor.findByStatusPage(statusPageId)

        val checkResultsPerMonitor = checkResultStatisticsService.getLastByMonitorIds(
            monitors.map { it.monitor.id },
            35,
        )

        val groupedMonitors = monitors.groupBy { it.groupMonitor.groupId }

        return groups.map { group ->
            Pair(
                group,
                groupedMonitors[group.id]?.map {
                    PublicMonitorMinResponse(
                        monitor = it.monitor,
                        oneDayUptime = checkResultStatisticsService.calculateRecentUptimeByMonitorId(
                            it.monitor.id,
                            TimeOption.ONE_DAY,
                        ).myFormat(),
                        lastCheckResults = checkResultsPerMonitor[it.monitor.id] ?: emptyList(),
                    )
                } ?: emptyList())
        }
    }

    @Operation(
        summary = "Get status page",
    )
    @GetMapping("/{slug}")
    @ResponseStatus(HttpStatus.OK)
    fun get(@PathVariable slug: String): PublicStatusPageResponse =
        statusPageService.findBySlug(slug)?.let {
            PublicStatusPageResponse(
                statusPage = it,
                groups = getStatusPageGroupsMonitorsAndCheckResults(it.id)
            )
        }.orThrowNotFound("Status page not found")

    @Operation(
        summary = "Get slug by domain",
    )
    @GetMapping("/byDomain/{domain}")
    @ResponseStatus(HttpStatus.OK)
    fun getByDomain(@PathVariable domain: String): PublicStatusPageResponse =
        statusPageService.findByDomainName(domain)?.let {
            PublicStatusPageResponse(
                statusPage = it,
                groups = getStatusPageGroupsMonitorsAndCheckResults(it.id)
            )
        }.orThrowNotFound("Status page not found")
}
