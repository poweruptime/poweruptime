package org.poweruptime.backend.features.monitor.service

import org.jetbrains.exposed.v1.jdbc.batchInsert
import org.poweruptime.backend.configuration.MONITOR_YEARLY_UPTIME_CACHE_KEY
import org.poweruptime.backend.core.utils.DAYS_PER_YEAR
import org.poweruptime.backend.core.utils.startOfWeek
import org.poweruptime.backend.features.monitor.core.PingAnalysis
import org.poweruptime.backend.features.monitor.core.TimeOption
import org.poweruptime.backend.features.monitor.domain.findByMonitorIdAndPickedUpBetween
import org.poweruptime.backend.features.monitor.domain.findByMonitorIdBetween
import org.poweruptime.backend.features.monitor.domain.findByMonitorIdBetweenDates
import org.poweruptime.backend.features.monitor.domain.findFirstByMonitorId
import org.poweruptime.backend.features.monitor.domain.findLastByMonitorId
import org.poweruptime.backend.features.monitor.domain.findLastByMonitorIdAtOrBefore
import org.poweruptime.backend.features.monitor.domain.findLastByMonitorIds
import org.poweruptime.backend.features.monitor.dto.DayUptimeStatistic
import org.poweruptime.backend.features.monitor.dto.DayUptimeStatistics
import org.poweruptime.backend.features.monitor.dto.PingTimelineDataEntryResponse
import org.poweruptime.backend.features.monitor.dto.PingTimelineResponse
import org.poweruptime.backend.features.monitor.dto.PublicMonitorStatistics
import org.poweruptime.backend.features.monitor.dto.PublicPingStatistics
import org.poweruptime.backend.features.monitor.dto.PublicUptimeStatistics
import org.poweruptime.backend.features.monitor.model.CheckResult
import org.poweruptime.backend.features.monitor.model.CheckResultRecord
import org.poweruptime.backend.features.monitor.model.HistoricalDayUptime
import org.poweruptime.backend.features.monitor.model.HistoricalDayUptimeRecord
import org.poweruptime.backend.features.monitor.model.MonitorUptimeEvent
import org.poweruptime.backend.features.monitor.model.MonitorUptimeEventRecord
import org.poweruptime.backend.features.monitor.model.MonitorUptimeEventStatus
import org.poweruptime.backend.features.monitor.model.PRECISION_SCALE
import org.springframework.beans.factory.ObjectProvider
import org.springframework.cache.CacheManager
import org.springframework.cache.annotation.Cacheable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.time.format.TextStyle
import java.time.temporal.ChronoUnit
import java.util.Locale
import kotlin.collections.filter
import kotlin.math.round

const val FULL_PERCENT = 100

fun BigDecimal.myFormat(): String {
    // Set the scale to 2 to ensure two decimal places and round if necessary
    val formattedValue = this.setScale(2, RoundingMode.HALF_UP).toString()
    return if (formattedValue == "100.00") "100%" else "$formattedValue%"
}

@Service
@Transactional(readOnly = true)
open class CheckResultStatisticsService(private val cacheManagerProvider: ObjectProvider<CacheManager>) {
    fun getLastByMonitorId(monitorId: ULong, limit: Int): List<CheckResultRecord> =
        CheckResult.findLastByMonitorId(monitorId, limit)

    fun getLastByMonitorIds(monitorIds: List<ULong>, limit: Int): Map<ULong, List<CheckResultRecord>> =
        CheckResult.findLastByMonitorIds(monitorIds, limit).groupBy { it.monitorId }

    @Cacheable(value = [MONITOR_YEARLY_UPTIME_CACHE_KEY])
    fun calculateYearlyUptime(monitorId: ULong): List<DayUptimeStatistics> {
        val currentDate = LocalDate.now(ZoneOffset.UTC)

        val lastYearHistoricalDayUptimes = getLastYearHistoricalDayUptime(monitorId)

        // Group existing records by their start-of-week
        val groupedByWeek = lastYearHistoricalDayUptimes.groupBy { it.date.startOfWeek() }

        // Collect all dates for the past 365 days into a map
        val pastYearGrouped = (0..DAYS_PER_YEAR).map { currentDate.minusDays(it.toLong()) }.groupBy { it.startOfWeek() }

        // Construct stats. For missing days, assume 100% uptime
        return pastYearGrouped
            .map { (startOfWeek, daysInWeek) ->
                val weekData = groupedByWeek[startOfWeek].orEmpty().associateBy { it.date }
                DayUptimeStatistics(
                    name = startOfWeek,
                    series = daysInWeek
                        .map { date ->
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

    fun uptimeStatisticsDto(monitorId: ULong): PublicMonitorStatistics {
        val now = Instant.now()
        val checkResults = CheckResult.findByMonitorIdAndPickedUpBetween(
            monitorId,
            now.minus(TimeOption.ONE_DAY.hours, ChronoUnit.HOURS),
            now,
        )

        fun calculateRecentUptime(timeOption: TimeOption): BigDecimal =
            calculateUptimeByMonitorId(monitorId, now.minus(timeOption.hours, ChronoUnit.HOURS), now)

        fun calculateRecentPing(timeOption: TimeOption): PingAnalysis? = calculateAveragePingFromCheckResults(
            checkResults,
            now.minus(timeOption.hours, ChronoUnit.HOURS),
            now,
        )

        return PublicMonitorStatistics(
            uptime = PublicUptimeStatistics(
                oneHour = calculateRecentUptime(TimeOption.ONE_HOUR).myFormat(),
                threeHours = calculateRecentUptime(TimeOption.THREE_HOURS)
                    .myFormat(),
                sixHours = calculateRecentUptime(TimeOption.SIX_HOURS).myFormat(),
                twelveHours = calculateRecentUptime(TimeOption.TWELVE_HOURS)
                    .myFormat(),
                oneDay = calculateRecentUptime(TimeOption.ONE_DAY).myFormat(),
                threeDays = calculateRecentUptime(TimeOption.THREE_DAYS).myFormat(),
                oneWeek = calculateRecentUptime(TimeOption.ONE_WEEK).myFormat(),
                twoWeeks = calculateRecentUptime(TimeOption.TWO_WEEKS).myFormat(),
                oneMonth = calculateRecentUptime(TimeOption.ONE_MONTH).myFormat(),
                threeMonths = calculateRecentUptime(TimeOption.THREE_MONTHS).myFormat(),
                sixMonths = calculateRecentUptime(TimeOption.SIX_MONTHS).myFormat(),
                oneYear = calculateRecentUptime(TimeOption.ONE_YEAR).myFormat(),
            ),
            ping = PublicPingStatistics(
                oneHour = calculateRecentPing(TimeOption.ONE_HOUR),
                threeHours = calculateRecentPing(TimeOption.THREE_HOURS),
                sixHours = calculateRecentPing(TimeOption.SIX_HOURS),
                twelveHours = calculateRecentPing(TimeOption.TWELVE_HOURS),
                oneDay = calculateRecentPing(TimeOption.ONE_DAY),
            ),
        )
    }

    fun calculateRecentUptimeByMonitorId(monitorId: List<ULong>, timeOption: TimeOption): Map<ULong, BigDecimal> {
        if (monitorId.isEmpty()) return emptyMap()
        val now = Instant.now()
        val start = now.minus(timeOption.hours, ChronoUnit.HOURS)
        return monitorId.distinct().associateWith { id ->
            calculateUptimeByMonitorId(id, start, now)
        }
    }

    fun calculateRecentUptimeByMonitorId(monitorId: ULong, timeOption: TimeOption): BigDecimal {
        val now = Instant.now()
        return calculateUptimeByMonitorId(monitorId, now.minus(timeOption.hours, ChronoUnit.HOURS), now)
    }

    @Transactional
    fun syncCheckResultsToHistoricalDayUptime(monitorId: ULong) {
        val zoneId = ZoneOffset.UTC
        val today = LocalDate.now(zoneId)

        // We want full past days only
        val endDate = today.minusDays(1)
        val firstEventDate = MonitorUptimeEvent.findFirstByMonitorId(monitorId)
            ?.effectiveAt
            ?.atZone(ZoneOffset.UTC)
            ?.toLocalDate()
            ?: return
        val startDate = maxOf(endDate.minusYears(1).plusDays(1), firstEventDate)

        if (startDate > endDate) return

        val existingDates = HistoricalDayUptime
            .findByMonitorIdBetweenDates(
                monitorId = monitorId,
                start = startDate,
                end = endDate,
            )
            .map { it.date }
            .toSet()

        val missingDates = generateSequence(startDate) { it.plusDays(1) }
            .takeWhile { it <= endDate }
            .filterNot { it in existingDates }
            .toList()

        if (missingDates.isEmpty()) return

        val entries = missingDates.map { date ->
            val startOfDay = date.atStartOfDay(zoneId).toInstant()
            val endOfDay = date.plusDays(1).atStartOfDay(zoneId).toInstant()
            val uptime = calculateUptimeByMonitorId(
                monitorId,
                startOfDay,
                endOfDay,
            )
            date to uptime
        }

        HistoricalDayUptime.batchInsert(entries, ignore = true) {
            this[HistoricalDayUptime.monitorId] = monitorId
            this[HistoricalDayUptime.date] = it.first
            this[HistoricalDayUptime.uptime] = it.second
        }
        cacheManagerProvider.ifAvailable?.getCache(MONITOR_YEARLY_UPTIME_CACHE_KEY)?.evict(monitorId)
    }

    private fun getLastYearHistoricalDayUptime(monitorId: ULong): List<HistoricalDayUptimeRecord> {
        val currentDate = LocalDate.now(ZoneOffset.UTC)

        return buildList {
            // Start with current day (most recent)
            add(
                HistoricalDayUptimeRecord(
                    id = 1UL,
                    monitorId = monitorId,
                    date = currentDate,
                    uptime = calculateUptimeByMonitorId(
                        monitorId,
                        currentDate.atStartOfDay(ZoneOffset.UTC).toInstant(),
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
        val statusAtStart = MonitorUptimeEvent.findLastByMonitorIdAtOrBefore(monitorId, start)?.status
            ?: MonitorUptimeEventStatus.UP
        val events = MonitorUptimeEvent.findByMonitorIdBetween(monitorId, start, end)
        return calculateUptimeFromEvents(events, statusAtStart, start, end) ?: BigDecimal(FULL_PERCENT)
    }
}

fun calculateAveragePingFromCheckResults(
    checkResults: List<CheckResultRecord>,
    start: Instant,
    end: Instant,
): PingAnalysis? {
    if (checkResults.isEmpty()) return null

    val filteredResults = checkResults.filter { result ->
        result.pickedUpAt!! in start..end && result.pingMs != null
    }

    if (filteredResults.isEmpty()) return null

    val averagePingMs = filteredResults.sumOf { it.pingMs!! } / filteredResults.size
    val midpoint = filteredResults.size / 2

    val firstHalfAverage = if (midpoint > 0) {
        filteredResults.take(midpoint).sumOf { it.pingMs!! } / midpoint
    } else {
        0L
    }

    val secondHalfAverage = if (filteredResults.size - midpoint > 0) {
        filteredResults.drop(midpoint).sumOf { it.pingMs!! } / (filteredResults.size - midpoint)
    } else {
        0L
    }

    val trendPercentage = if (firstHalfAverage == 0L) {
        0.0
    } else {
        ((secondHalfAverage - firstHalfAverage).toDouble() / firstHalfAverage) * 100
    }

    val roundedTrend = round(trendPercentage * 100) / 100

    return PingAnalysis(averagePingMs, roundedTrend.toString())
}

fun calculateUptimeFromEvents(
    events: List<MonitorUptimeEventRecord>,
    statusAtStart: MonitorUptimeEventStatus = MonitorUptimeEventStatus.UP,
    start: Instant,
    end: Instant,
): BigDecimal? {
    val totalDurationNanos = Duration.between(start, end).toNanos().toBigDecimal()
    if (totalDurationNanos <= BigDecimal.ZERO) return null

    var currentStatus = statusAtStart
    var cursor = start
    var upDurationNanos = BigDecimal.ZERO

    events.asSequence()
        .filter { it.effectiveAt.isAfter(start) && it.effectiveAt.isBefore(end) }
        .sortedWith(compareBy<MonitorUptimeEventRecord> { it.effectiveAt }.thenBy { it.id })
        .forEach { event ->
            if (currentStatus == MonitorUptimeEventStatus.UP) {
                upDurationNanos += Duration.between(cursor, event.effectiveAt).toNanos().toBigDecimal()
            }
            currentStatus = event.status
            cursor = event.effectiveAt
        }

    if (currentStatus == MonitorUptimeEventStatus.UP) {
        upDurationNanos += Duration.between(cursor, end).toNanos().toBigDecimal()
    }

    return upDurationNanos
        .divide(totalDurationNanos, PRECISION_SCALE, RoundingMode.HALF_UP)
        .multiply(BigDecimal(FULL_PERCENT))
}

fun generatePingTimelineEntries(
    startInstant: Instant,
    endInstant: Instant,
    precisionMillis: Long,
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
    halfPrecisionSeconds: Long,
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

private fun Set<Instant>.findClosestBucket(timestamp: Instant, halfPrecisionSeconds: Long): Instant? =
    firstOrNull { bucket ->
        timestamp in bucket.minusSeconds(halfPrecisionSeconds)..bucket.plusSeconds(halfPrecisionSeconds)
    }
