package org.poweruptime.backend.features.monitor.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.poweruptime.backend.features.monitor.dto.DayUptimeStatistics
import org.poweruptime.backend.features.monitor.dto.PublicMonitorResponse
import org.poweruptime.backend.features.monitor.service.CheckResultService
import org.poweruptime.backend.features.monitor.service.MonitorService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/public/monitor")
@Tag(name = "Public Monitor API")
class PublicMonitorController(
    private val monitorService: MonitorService,
    private val checkResultService: CheckResultService,
) {
    @Operation(
        summary = "Get monitor",
    )
    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun get(@PathVariable id: String): PublicMonitorResponse =
        monitorService.getByIdOrThrow(id).let {
            PublicMonitorResponse(
                monitor = it,
                uptime = checkResultService.uptimeStatisticsDto(it),
                lastCheckResults = checkResultService.getLastByMonitorId(it.id, 100),
            )
        }

    @Operation(
        summary = "Get monitor yearly uptime",
    )
    @GetMapping("/{id}/yearly")
    @ResponseStatus(HttpStatus.OK)
    fun getYearlyUptime(@PathVariable id: String): List<DayUptimeStatistics> =
        monitorService.getByIdOrThrow(id).let {
            checkResultService.calculateYearlyUptime(it)
        }
}
