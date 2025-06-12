package org.poweruptime.backend.features.monitor.service

import jakarta.persistence.criteria.CriteriaBuilder
import jakarta.persistence.criteria.CriteriaQuery
import jakarta.persistence.criteria.Root
import jakarta.transaction.Transactional
import org.poweruptime.backend.core.Filter
import org.poweruptime.backend.core.FilterCompare
import org.poweruptime.backend.core.dto.PageableValidator
import org.poweruptime.backend.core.service.AEntityService
import org.poweruptime.backend.core.toPredicate
import org.poweruptime.backend.core.utils.DAYS_PER_YEAR
import org.poweruptime.backend.core.utils.HOURS_PER_DAY
import org.poweruptime.backend.features.monitor.core.TimeOption
import org.poweruptime.backend.features.monitor.domain.CheckResultRepository
import org.poweruptime.backend.features.monitor.domain.HistoricalDayUptimeRepository
import org.poweruptime.backend.features.monitor.dto.DayUptimeStatistic
import org.poweruptime.backend.features.monitor.dto.DayUptimeStatistics
import org.poweruptime.backend.features.monitor.dto.PingTimelineDataEntryResponse
import org.poweruptime.backend.features.monitor.dto.PingTimelineResponse
import org.poweruptime.backend.features.monitor.dto.PublicMonitorUptimeStatistics
import org.poweruptime.backend.features.monitor.model.CheckResult
import org.poweruptime.backend.features.monitor.model.HistoricalDayUptime
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.MonitorStatus
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

const val PRECISION_SCALE = 4
const val FULL_PERCENT = 100

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

        val lastYearHistoricalDayUptimes = getLastYearHistoricalDayUptime(monitor)

        // Group existing records by their start-of-week
        val groupedByWeek = lastYearHistoricalDayUptimes.groupBy { it.date.startOfWeek() }

        // Collect all dates for the past 365 days into a map
        val pastYearGrouped = (0..DAYS_PER_YEAR).map { currentDate.minusDays(it.toLong()) }.groupBy { it.startOfWeek() }

        // Construct stats. For missing days, assume 100% uptime
        return pastYearGrouped.map { (startOfWeek, daysInWeek) ->
            val weekData = groupedByWeek[startOfWeek].orEmpty().associateBy { it.date }
            DayUptimeStatistics(
                name = startOfWeek,
                series = daysInWeek.map { date ->
                    val day = weekData[date]
                    val uptime = day?.uptime ?: BigDecimal(FULL_PERCENT)
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

        fun calculateRecentUptime(
            timeOption: TimeOption,
        ): BigDecimal = calculateUptimeFromCheckResults(
            checkResults,
            now.minus(timeOption.hours, ChronoUnit.HOURS),
            now,
        ) ?: BigDecimal(FULL_PERCENT)

        val lastYearHistoricalDayUptimes = getLastYearHistoricalDayUptime(monitor)

        return PublicMonitorUptimeStatistics(
            oneHour = calculateRecentUptime(TimeOption.ONE_HOUR).myFormat(),
            threeHours = calculateRecentUptime(TimeOption.THREE_HOURS)
                .myFormat(),
            sixHours = calculateRecentUptime(TimeOption.SIX_HOURS).myFormat(),
            twelveHours = calculateRecentUptime(TimeOption.TWELVE_HOURS)
                .myFormat(),
            oneDay = calculateRecentUptime(TimeOption.ONE_DAY).myFormat(),
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

    fun calculateRecentUptimeByMonitorId(monitorId: String, timeOption: TimeOption): BigDecimal {
        val now = Instant.now()
        val checkResults = checkResultRepository.findByMonitorIdAndPickedUpBetween(
            monitorId,
            now.minus(timeOption.hours, ChronoUnit.HOURS),
            now,
        )
        return calculateUptimeFromCheckResults(checkResults, now.minus(timeOption.hours, ChronoUnit.HOURS), now)
            ?: BigDecimal(FULL_PERCENT)
    }

    @Transactional
    fun syncCheckResultsToHistoricalDayUptime(monitor: Monitor) {
        val currentDate = LocalDate.now()
        val startOfYearAgo = currentDate.minusYears(1)
        val existing = historicalDayUptimeRepository.findByMonitorIdBetweenDates(
            monitor.id,
            startOfYearAgo,
            currentDate,
        ).map { it.date }.toSet()

        val totalDays = (TimeOption.ONE_YEAR.hours / HOURS_PER_DAY).toInt()
        val zoneId = ZoneId.systemDefault()

        // Use a sequence to generate dates and filter out existing ones
        val newEntries = (1 until totalDays)
            .asSequence()
            .map { currentDate.minusDays(it.toLong()) }
            .filterNot { existing.contains(it) }
            .map { dateToProcess ->
                val startOfDay = dateToProcess.atStartOfDay(zoneId).toInstant()
                val endOfDay = dateToProcess.plusDays(1).atStartOfDay(zoneId).toInstant()
                val uptime = calculateUptimeByMonitorId(monitor.id, startOfDay, endOfDay)
                HistoricalDayUptime(
                    monitor = monitor,
                    date = dateToProcess,
                    uptime = uptime,
                )
            }
            .toList() // Convert the sequence to a list for saveAll

        // Save all newly computed days at once
        if (newEntries.isNotEmpty()) {
            historicalDayUptimeRepository.saveAll(newEntries)
        }
    }

    private fun getLastYearHistoricalDayUptime(monitor: Monitor): List<HistoricalDayUptime> {
        val currentDate = LocalDate.now()

        return buildList {
            // Start with current day (most recent)
            add(
                HistoricalDayUptime(
                    monitor = monitor,
                    date = currentDate,
                    uptime = calculateUptimeByMonitorId(
                        monitor.id,
                        currentDate.atStartOfDay(ZoneId.systemDefault()).toInstant(),
                        Instant.now(),
                    ),
                ),
            )
            addAll(
                historicalDayUptimeRepository.findByMonitorIdBetweenDates(
                    monitor.id,
                    currentDate.minusYears(1),
                    currentDate,
                ),
            )
        }
    }

    private fun calculateUptimeByMonitorId(monitorId: String, start: Instant, end: Instant): BigDecimal {
        val results = checkResultRepository.findByMonitorIdAndPickedUpBetween(monitorId, start, end)
        return calculateUptimeFromCheckResults(results, start, end) ?: BigDecimal(FULL_PERCENT)
    }
}

fun calculateHistoricalUptime(
    historicalDayUptimes: List<HistoricalDayUptime>,
    timeOption: TimeOption
): BigDecimal {
    val daysCount = (timeOption.hours / HOURS_PER_DAY).toInt()
    // Ensure the list is large enough
    if (daysCount > historicalDayUptimes.size) {
        return BigDecimal("100.0000")
    }
    val days = historicalDayUptimes.take(daysCount)
    val totalUptime = days.fold(BigDecimal.ZERO) { acc, day -> acc + day.uptime }
    return totalUptime.divide(BigDecimal(days.size), PRECISION_SCALE, RoundingMode.HALF_UP)
}

fun calculateUptimeFromCheckResults(
    checkResults: List<CheckResult>,
    start: Instant,
    end: Instant
): BigDecimal? {
    if (checkResults.isEmpty()) return null

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

    return totalUpDurationMs.divide(totalDurationMs, PRECISION_SCALE, RoundingMode.HALF_UP)
        .multiply(BigDecimal(FULL_PERCENT))
}

fun generatePingTimelineEntries(
    startInstant: Instant,
    endInstant: Instant,
    precisionMillis: Long
): List<PingTimelineDataEntryResponse> {
    val entries = mutableListOf<PingTimelineDataEntryResponse>()
    var currentMillis = startInstant.toEpochMilli()
    val endMillis = endInstant.toEpochMilli()

    while (currentMillis <= endMillis) {
        entries.add(PingTimelineDataEntryResponse(Instant.ofEpochMilli(currentMillis)))
        currentMillis += precisionMillis
    }

    return entries
}

@Suppress("NestedBlockDepth")
fun buildPingTimelineResponse(
    entries: List<PingTimelineDataEntryResponse>,
    checkResults: List<CheckResult>,
    halfPrecisionSeconds: Long
): PingTimelineResponse {
    var highestValue = 0L
    var smallestValue = Long.MAX_VALUE // Initialize to max value so first comparison works

    // Create a map for faster lookups
    val entryMap = entries.associateBy { it.name }

    // Track count of pings per bucket to calculate average
    val pingCountMap = mutableMapOf<Instant, Int>()

    // Group check results by their corresponding time bucket
    checkResults.forEach { checkResult ->
        // Find the closest time bucket
        val bucketInstant = entryMap.keys.findClosestBucket(checkResult.pickedUpAt!!, halfPrecisionSeconds)
        bucketInstant?.let { instant ->
            entryMap[instant]?.let { entry ->
                checkResult.pingMs?.let { pingMs ->
                    entry.value += pingMs
                    pingCountMap[instant] = pingCountMap.getOrDefault(instant, 0) + 1
                }
            }
        }
    }

    // Calculate averages for each bucket
    entryMap.forEach { (instant, entry) ->
        val count = pingCountMap.getOrDefault(instant, 0)
        if (count > 0) {
            // Calculate average
            entry.value /= count

            // Update highest and smallest values
            if (entry.value > 0) { // Only consider buckets with data
                highestValue = maxOf(entry.value, highestValue)
                smallestValue = minOf(entry.value, smallestValue)
            }
        }
    }

    // If no data was found, reset smallestValue
    if (smallestValue == Long.MAX_VALUE) {
        smallestValue = 0L
    }

    return PingTimelineResponse(
        highestValue = highestValue + 50,
        smallestValue = if (smallestValue - 50 >= 0) smallestValue - 50 else 0,
        data = entries,
    )
}

private fun Set<Instant>.findClosestBucket(
    timestamp: Instant,
    halfPrecisionSeconds: Long
): Instant? = firstOrNull { bucket ->
    timestamp in bucket.minusSeconds(halfPrecisionSeconds)..bucket.plusSeconds(halfPrecisionSeconds)
}
