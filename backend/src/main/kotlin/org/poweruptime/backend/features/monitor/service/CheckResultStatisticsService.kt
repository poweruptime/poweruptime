package org.poweruptime.backend.features.monitor.service

import org.jetbrains.exposed.v1.jdbc.batchInsert
import org.poweruptime.backend.configuration.MONITOR_RECENT_UPTIME_CACHE_KEY
import org.poweruptime.backend.configuration.MONITOR_UPTIME_STATISTICS_CACHE_KEY
import org.poweruptime.backend.configuration.MONITOR_YEARLY_UPTIME_CACHE_KEY
import org.poweruptime.backend.core.utils.DAYS_PER_YEAR
import org.poweruptime.backend.core.utils.HOURS_PER_DAY
import org.poweruptime.backend.core.utils.startOfWeek
import org.poweruptime.backend.features.monitor.core.TimeOption
import org.poweruptime.backend.features.monitor.domain.findByMonitorIdAndPickedUpBetween
import org.poweruptime.backend.features.monitor.domain.findByMonitorIdBetweenDates
import org.poweruptime.backend.features.monitor.domain.findLastByMonitorId
import org.poweruptime.backend.features.monitor.domain.findLastByMonitorIds
import org.poweruptime.backend.features.monitor.dto.DayUptimeStatistic
import org.poweruptime.backend.features.monitor.dto.DayUptimeStatistics
import org.poweruptime.backend.features.monitor.dto.PingTimelineDataEntryResponse
import org.poweruptime.backend.features.monitor.dto.PingTimelineResponse
import org.poweruptime.backend.features.monitor.dto.PublicMonitorUptimeStatistics
import org.poweruptime.backend.features.monitor.model.CheckResult
import org.poweruptime.backend.features.monitor.model.CheckResultRecord
import org.poweruptime.backend.features.monitor.model.HistoricalDayUptime
import org.poweruptime.backend.features.monitor.model.HistoricalDayUptimeRecord
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.PRECISION_SCALE
import org.springframework.cache.annotation.Cacheable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.TextStyle
import java.time.temporal.ChronoUnit
import java.util.Locale

const val FULL_PERCENT = 100

fun BigDecimal.myFormat(): String {
    // Set the scale to 2 to ensure two decimal places and round if necessary
    val formattedValue = this.setScale(2, RoundingMode.HALF_UP).toString()
    return if (formattedValue == "100.00") "100%" else "$formattedValue%"
}

@Service
@Transactional(readOnly = true)
class CheckResultStatisticsService {

    fun getLastByMonitorId(monitorId: ULong, limit: Int): List<CheckResultRecord> =
        CheckResult.findLastByMonitorId(monitorId, limit)

    fun getLastByMonitorIds(monitorIds: List<ULong>, limit: Int): Map<ULong, List<CheckResultRecord>> =
        CheckResult.findLastByMonitorIds(monitorIds, limit).groupBy { it.monitorId }

    @Cacheable(value = [MONITOR_YEARLY_UPTIME_CACHE_KEY])
    fun calculateYearlyUptime(monitorId: ULong): List<DayUptimeStatistics> {
        val currentDate = LocalDate.now()

        val lastYearHistoricalDayUptimes = getLastYearHistoricalDayUptime(monitorId)

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

    @Cacheable(value = [MONITOR_UPTIME_STATISTICS_CACHE_KEY])
    fun uptimeStatisticsDto(monitorId: ULong): PublicMonitorUptimeStatistics {
        val now = Instant.now()
        val checkResults = CheckResult.findByMonitorIdAndPickedUpBetween(
            monitorId,
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

        val lastYearHistoricalDayUptimes = getLastYearHistoricalDayUptime(monitorId)

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

    @Cacheable(value = [MONITOR_RECENT_UPTIME_CACHE_KEY])
    fun calculateRecentUptimeByMonitorId(monitorId: ULong, timeOption: TimeOption): BigDecimal {
        val now = Instant.now()
        val checkResults = CheckResult.findByMonitorIdAndPickedUpBetween(
            monitorId,
            now.minus(timeOption.hours, ChronoUnit.HOURS),
            now,
        )
        return calculateUptimeFromCheckResults(checkResults, now.minus(timeOption.hours, ChronoUnit.HOURS), now)
            ?: BigDecimal(FULL_PERCENT)
    }

    @Transactional
    fun syncCheckResultsToHistoricalDayUptime(monitorId: ULong) {
        val currentDate = LocalDate.now()
        val startOfYearAgo = currentDate.minusYears(1)
        val existing = HistoricalDayUptime.findByMonitorIdBetweenDates(
            monitorId,
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
                val uptime = calculateUptimeByMonitorId(monitorId, startOfDay, endOfDay)
                Pair(dateToProcess, uptime)
            }
            .toList() // Convert the sequence to a list for saveAll

        if (newEntries.isNotEmpty()) {
            HistoricalDayUptime.batchInsert(newEntries) { (date, uptime) ->
                this[HistoricalDayUptime.monitorId] = monitorId
                this[HistoricalDayUptime.date] = date
                this[HistoricalDayUptime.uptime] = uptime
            }
        }
    }

    private fun getLastYearHistoricalDayUptime(monitorId: ULong): List<HistoricalDayUptimeRecord> {
        val currentDate = LocalDate.now()

        return buildList {
            // Start with current day (most recent)
            add(
                HistoricalDayUptimeRecord(
                    id = 1UL,
                    monitorId = monitorId,
                    date = currentDate,
                    uptime = calculateUptimeByMonitorId(
                        monitorId,
                        currentDate.atStartOfDay(ZoneId.systemDefault()).toInstant(),
                        Instant.now(),
                    ),
                ),
            )
            addAll(
                HistoricalDayUptime.findByMonitorIdBetweenDates(
                    monitorId,
                    currentDate.minusYears(1),
                    currentDate,
                ),
            )
        }
    }

    private fun calculateUptimeByMonitorId(monitorId: ULong, start: Instant, end: Instant): BigDecimal {
        val results = CheckResult.findByMonitorIdAndPickedUpBetween(monitorId, start, end)
        return calculateUptimeFromCheckResults(results, start, end) ?: BigDecimal(FULL_PERCENT)
    }
}

fun calculateHistoricalUptime(
    historicalDayUptimes: List<HistoricalDayUptimeRecord>,
    timeOption: TimeOption
): BigDecimal {
    val daysCount = (timeOption.hours / HOURS_PER_DAY).toInt()
    // Ensure the list is large enough
    if (daysCount > historicalDayUptimes.size) {
        return BigDecimal("100.000")
    }
    val days = historicalDayUptimes.take(daysCount)
    val totalUptime = days.fold(BigDecimal.ZERO) { acc, day -> acc + day.uptime }
    return totalUptime.divide(BigDecimal(days.size), PRECISION_SCALE, RoundingMode.HALF_UP)
}

fun calculateUptimeFromCheckResults(
    checkResults: List<CheckResultRecord>,
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
    checkResults: List<CheckResultRecord>,
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

    // Round down to nearest multiple of 50, but never below 0
    val smallestRounded = maxOf((smallestValue / 50) * 50, 0)
    // Round up to nearest multiple of 50
    val highestRounded = ((highestValue + 49) / 50) * 50

    return PingTimelineResponse(
        highestValue = highestRounded,
        smallestValue = smallestRounded,
        data = entries,
    )
}

private fun Set<Instant>.findClosestBucket(
    timestamp: Instant,
    halfPrecisionSeconds: Long
): Instant? = firstOrNull { bucket ->
    timestamp in bucket.minusSeconds(halfPrecisionSeconds)..bucket.plusSeconds(halfPrecisionSeconds)
}
