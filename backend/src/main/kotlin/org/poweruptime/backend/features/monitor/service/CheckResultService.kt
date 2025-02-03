package org.poweruptime.backend.features.monitor.service

import jakarta.persistence.criteria.CriteriaBuilder
import jakarta.persistence.criteria.CriteriaQuery
import jakarta.persistence.criteria.Root
import org.poweruptime.backend.core.*
import org.poweruptime.backend.core.dto.PageableValidator
import org.poweruptime.backend.core.service.AEntityService
import org.poweruptime.backend.features.monitor.domain.CheckResultRepository
import org.poweruptime.backend.features.monitor.domain.HistoricalDayUptimeRepository
import org.poweruptime.backend.features.monitor.dto.DayUptimeStatistic
import org.poweruptime.backend.features.monitor.dto.DayUptimeStatistics
import org.poweruptime.backend.features.monitor.dto.PublicMonitorUptimeStatistics
import org.poweruptime.backend.features.monitor.model.CheckResult
import org.poweruptime.backend.features.monitor.model.HistoricalDayUptime
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.TimeOption
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.DayOfWeek
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.TextStyle
import java.time.temporal.ChronoUnit
import java.time.temporal.TemporalAdjusters
import java.util.Locale

private fun LocalDate.startOfWeek(): LocalDate =
    this.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))

fun BigDecimal.myFormat(): String {
    // Set the scale to 2 to ensure two decimal places and round if necessary
    val formattedValue = this.setScale(2, RoundingMode.HALF_UP).toString()
    return if (formattedValue == "100.00") "100%" else "$formattedValue%"
}

@Service
class CheckResultService(
    private val historicalDayUptimeRepository: HistoricalDayUptimeRepository,
    private val checkResultRepository: CheckResultRepository
) : AEntityService<CheckResult>(checkResultRepository) {
    fun getLastByMonitorId(monitorId: String, limit: Int) =
        checkResultRepository.findLastByMonitorId(monitorId, limit)

    fun deleteByTeamIdAndOlderThan(teamId: String, than: Instant) = checkResultRepository.findByTeamIdAndOlderThan(
        teamId,
        than,
    ).apply {
        deleteAll(this)
    }

    fun getAllPaginated(
        pageable: Pageable,
        onlyChanges: Boolean,
        monitorId: String?,
        teamId: String?,
        userId: String?,
        statuses: List<MonitorStatus>?,
    ): Page<CheckResult> = checkResultRepository.findAll(
        { root: Root<CheckResult>, query: CriteriaQuery<*>?, criteriaBuilder: CriteriaBuilder ->
            assert(
                (userId !== null && teamId == null && monitorId == null) ||
                    (userId === null && teamId != null && monitorId == null) ||
                    (userId === null && teamId == null && monitorId != null),
            )

            query?.distinct(true)

            val idPredicate = when {
                teamId != null -> Filter("monitor.team.id", teamId, FilterCompare.EQ)
                monitorId != null -> Filter("monitor.id", monitorId, FilterCompare.EQ)
                userId != null -> Filter("monitor.team.teamUsers.id.user.id", userId, FilterCompare.EQ)
                else -> throw AssertionError("teamId or monitorId or userId needs to be provided")
            }.toPredicate(root, criteriaBuilder)

            val filterPredicates = if (onlyChanges || !statuses.isNullOrEmpty() || teamId != null || userId != null) {
                criteriaBuilder.and(
                    *buildList {
                        statuses?.let { add(Filter("status", it, FilterCompare.IN)) }
                        if (onlyChanges) {
                            add(Filter("status", "previousStatus", FilterCompare.NOT_EQUAL_TO))
                        }
                        if (teamId != null || userId != null) {
                            add(Filter("monitor.deleted", "", FilterCompare.IS_NULL))
                        }
                    }.toPredicate(root, criteriaBuilder).toTypedArray(),
                )
            } else {
                null
            }

            if (filterPredicates != null) {
                criteriaBuilder.and(idPredicate, filterPredicates)
            } else {
                idPredicate
            }
        },
        PageableValidator.validateSort(
            pageable,
            listOf("status", "pickedUpAt", "checkedAt", "createdAt"),
        ),
    )

    fun calculateYearlyUptime(monitor: Monitor): List<DayUptimeStatistics> {
        val currentDate = LocalDate.now()
        val now = Instant.now()
        val startOfDayNow = currentDate.atStartOfDay(ZoneId.systemDefault()).toInstant()

        // Get current day uptime on the fly
        val currentDayUptime = HistoricalDayUptime(
            monitor = monitor,
            date = currentDate,
            uptime = calculateUptime(
                monitor.id,
                startOfDayNow,
                now,
            ),
        )

        val historicalDayUptimes = historicalDayUptimeRepository.findByMonitorIdBetweenDates(
            monitor.id,
            currentDate.minusMonths(12),
            currentDate,
        ).toMutableList()

        historicalDayUptimes.add(currentDayUptime)

        // Group existing records by their start-of-week
        val groupedByWeek = historicalDayUptimes.groupBy { it.date.startOfWeek() }

        // Collect all dates for the past 365 days into a map
        val pastYearDates = (0..365).map { currentDate.minusDays(it.toLong()) }
        val pastYearGrouped = pastYearDates.groupBy { it.startOfWeek() }

        // Construct stats. For missing days, assume 100% uptime
        return pastYearGrouped.map { (startOfWeek, daysInWeek) ->
            val weekData = groupedByWeek[startOfWeek].orEmpty().associateBy { it.date }
            DayUptimeStatistics(
                name = startOfWeek,
                series = daysInWeek.map { date ->
                    val day = weekData[date]
                    val uptime = day?.uptime ?: BigDecimal(100)
                    DayUptimeStatistic(
                        date = date,
                        name = date.dayOfWeek.getDisplayName(TextStyle.FULL, Locale.getDefault()),
                        value = uptime.myFormat(),
                    )
                }.reversed(),
            )
        }.reversed()
    }

    fun uptimeStatisticsDto(monitor: Monitor): PublicMonitorUptimeStatistics {
        val now = Instant.now()
        val checkResults = checkResultRepository.findByMonitorIdAndPickedUpBetween(
            monitor.id,
            now.minus(TimeOption.ONE_DAY.hours, ChronoUnit.HOURS),
            now,
        )

        val lastYearHistoricalDayUptimes = getLastYearHistoricalDayUptime(monitor)

        return PublicMonitorUptimeStatistics(
            oneHour = calculateRecentUptime(checkResults, TimeOption.ONE_HOUR, now).myFormat(),
            threeHours = calculateRecentUptime(checkResults, TimeOption.THREE_HOURS, now)
                .myFormat(),
            sixHours = calculateRecentUptime(checkResults, TimeOption.SIX_HOURS, now).myFormat(),
            twelveHours = calculateRecentUptime(checkResults, TimeOption.TWELVE_HOURS, now)
                .myFormat(),
            oneDay = calculateRecentUptime(checkResults, TimeOption.ONE_DAY, now).myFormat(),
            threeDays = calculateHistoricalUptime(
                lastYearHistoricalDayUptimes,
                TimeOption.THREE_DAYS,
            ).myFormat(),
            oneWeek = calculateHistoricalUptime(
                lastYearHistoricalDayUptimes,
                TimeOption.ONE_WEEK,
            ).myFormat(),
            twoWeeks = calculateHistoricalUptime(
                lastYearHistoricalDayUptimes,
                TimeOption.TWO_WEEKS,
            ).myFormat(),
            oneMonth = calculateHistoricalUptime(
                lastYearHistoricalDayUptimes,
                TimeOption.ONE_MONTH,
            ).myFormat(),
            threeMonths = calculateHistoricalUptime(
                lastYearHistoricalDayUptimes,
                TimeOption.THREE_MONTHS,
            ).myFormat(),
            sixMonths = calculateHistoricalUptime(
                lastYearHistoricalDayUptimes,
                TimeOption.SIX_MONTHS,
            ).myFormat(),
            oneYear = calculateHistoricalUptime(
                lastYearHistoricalDayUptimes,
                TimeOption.ONE_YEAR,
            ).myFormat(),
        )
    }

    fun calculateRecentUptime(monitorId: String, timeOption: TimeOption): BigDecimal {
        val now = Instant.now()
        val checkResults = checkResultRepository.findByMonitorIdAndPickedUpBetween(
            monitorId,
            now.minus(timeOption.hours, ChronoUnit.HOURS),
            now,
        )
        return calculateUptimeFromCheckResults(checkResults, now.minus(timeOption.hours, ChronoUnit.HOURS), now)
            ?: BigDecimal(100)
    }

    private fun getLastYearHistoricalDayUptime(monitor: Monitor): List<HistoricalDayUptime> {
        val currentDate = LocalDate.now()
        val startOfYearAgo = currentDate.minusDays(TimeOption.ONE_YEAR.hours / 24)
        val existing = historicalDayUptimeRepository.findByMonitorIdBetweenDates(
            monitor.id,
            startOfYearAgo,
            currentDate,
        ).associateBy { it.date }

        val totalDays = (TimeOption.ONE_YEAR.hours / 24).toInt()
        val now = Instant.now()
        val zoneId = ZoneId.systemDefault()

        // Precompute startOfDay once per iteration
        val newEntries = mutableListOf<HistoricalDayUptime>()
        val days = mutableListOf<HistoricalDayUptime>()

        for (i in 1 until totalDays) {
            val dateToProcess = currentDate.minusDays(i.toLong())
            val existingDay = existing[dateToProcess]
            if (existingDay != null) {
                days.add(existingDay)
            } else {
                val startOfDay = dateToProcess.atStartOfDay(zoneId).toInstant()
                val endOfDay = dateToProcess.plusDays(1).atStartOfDay(zoneId).toInstant()
                val uptime = calculateUptime(monitor.id, startOfDay, endOfDay)
                newEntries.add(
                    HistoricalDayUptime(
                        monitor = monitor,
                        date = dateToProcess,
                        uptime = uptime,
                    ),
                )
            }
        }

        // Save all newly computed days at once
        if (newEntries.isNotEmpty()) {
            days.addAll(historicalDayUptimeRepository.saveAll(newEntries))
        }

        // Current day calculation
        val todayUptime = calculateUptime(
            monitor.id,
            currentDate.atStartOfDay(zoneId).toInstant(),
            now,
        )
        days.add(
            HistoricalDayUptime(
                monitor = monitor,
                date = currentDate,
                uptime = todayUptime,
            ),
        )

        return days.sortedBy { it.date }
    }

    private fun calculateRecentUptime(
        checkResults: List<CheckResult>,
        timeOption: TimeOption,
        now: Instant
    ): BigDecimal = calculateUptimeFromCheckResults(
        checkResults,
        now.minus(timeOption.hours, ChronoUnit.HOURS),
        now,
    ) ?: BigDecimal(100)

    private fun calculateHistoricalUptime(
        historicalDayUptimes: List<HistoricalDayUptime>,
        timeOption: TimeOption
    ): BigDecimal {
        val daysCount = (timeOption.hours / 24).toInt()
        // Ensure the list is large enough
        if (daysCount >= historicalDayUptimes.size) {
            return BigDecimal(100)
        }
        val days = historicalDayUptimes.take(daysCount + 1)
        val totalUptime = days.fold(BigDecimal.ZERO) { acc, day -> acc + day.uptime }
        return totalUptime.divide(BigDecimal(days.size), 4, RoundingMode.HALF_UP)
    }

    private fun calculateUptime(monitorId: String, start: Instant, end: Instant): BigDecimal {
        val results = checkResultRepository.findByMonitorIdAndPickedUpBetween(monitorId, start, end)
        return calculateUptimeFromCheckResults(results, start, end) ?: BigDecimal(100)
    }
}

fun calculateUptimeFromCheckResults(
    checkResults: List<CheckResult>,
    start: Instant,
    end: Instant
): BigDecimal? {
    if (checkResults.isEmpty()) return null

    // Sort by pickedUpAt to make the loop efficient
    val totalDurationMs = Duration.between(start, end).toMillis().toBigDecimal()
    if (totalDurationMs <= BigDecimal.ZERO) return null

    var totalUpDurationMs = totalDurationMs
    var lastStatusChangeTime = start

    for (checkResult in checkResults) {
        val pickedUpAt = checkResult.pickedUpAt!!
        when {
            (pickedUpAt.isAfter(start) || pickedUpAt == start) && pickedUpAt.isBefore(end) -> {
                // Only consider durations when continuous DOWN state persists
                if (checkResult.status == MonitorStatus.DOWN && checkResult.previousStatus == MonitorStatus.DOWN) {
                    val downDurationMs = Duration.between(lastStatusChangeTime, pickedUpAt).toMillis().toBigDecimal()
                    totalUpDurationMs = totalUpDurationMs.subtract(downDurationMs)
                }
                lastStatusChangeTime = pickedUpAt
            }
            pickedUpAt.isAfter(end) || pickedUpAt == end -> {
                // Since results are sorted and this one is beyond the end,
                // no need to check further results.
                break
            }
        }
    }

    // Avoid division by zero or negative values
    if (totalUpDurationMs <= BigDecimal.ZERO) {
        return BigDecimal.ZERO
    }

    return totalUpDurationMs.divide(totalDurationMs, 4, RoundingMode.HALF_UP)
        .multiply(BigDecimal(100))
}
