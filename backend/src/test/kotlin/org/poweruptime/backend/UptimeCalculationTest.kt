package org.poweruptime.backend

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.poweruptime.backend.core.ModelFactory
import org.poweruptime.backend.features.monitor.model.CheckResult
import org.poweruptime.backend.features.monitor.model.HistoricalDayUptime
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.TimeOption
import org.poweruptime.backend.features.monitor.service.calculateHistoricalUptime
import org.poweruptime.backend.features.monitor.service.calculateUptimeFromCheckResults
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate

@Suppress("VariableNaming")
class UptimeCalculationTest {
    private val testMonitor = ModelFactory.getTestMonitor()

    @Nested
    @DisplayName("calculateUptime")
    inner class CalculateUptime {
        @Test
        fun `test empty list`() {
            assertThat(
                calculateUptimeFromCheckResults(listOf(), Instant.now(), Instant.now().minusSeconds(60 * 60)),
            ).isNull()
        }

        private val date_12_12_2024 = Instant.ofEpochSecond(1733961600)
        private val date_13_12_2024 = Instant.ofEpochSecond(1734048000)

        @Test
        fun `test empty list with start and end`() {
            assertThat(
                calculateUptimeFromCheckResults(listOf(), date_12_12_2024, date_13_12_2024),
            ).isNull()
        }

        @Test
        fun `test up check result exactly at start`() {
            assertThat(
                calculateUptimeFromCheckResults(
                    listOf(
                        CheckResult(
                            status = MonitorStatus.UP,
                            previousStatus = MonitorStatus.PENDING,
                            monitor = testMonitor,
                            pickedUpAt = date_12_12_2024,
                        ),
                    ),
                    date_12_12_2024,
                    date_13_12_2024,
                ),
            ).isEqualTo(BigDecimal("100.0000"))
        }

        @Test
        fun `test up check result exactly at end`() {
            assertThat(
                calculateUptimeFromCheckResults(
                    listOf(
                        CheckResult(
                            status = MonitorStatus.UP,
                            previousStatus = MonitorStatus.PENDING,
                            monitor = testMonitor,
                            pickedUpAt = date_13_12_2024,
                        ),
                    ),
                    date_12_12_2024,
                    date_13_12_2024,
                ),
            ).isEqualTo(BigDecimal("100.0000"))
        }

        @Test
        fun `test up check result 1 second before end`() {
            assertThat(
                calculateUptimeFromCheckResults(
                    listOf(
                        CheckResult(
                            status = MonitorStatus.UP,
                            previousStatus = MonitorStatus.PENDING,
                            monitor = testMonitor,
                            pickedUpAt = date_13_12_2024.minusSeconds(1),
                        ),
                    ),
                    date_12_12_2024,
                    date_13_12_2024,
                ),
            ).isEqualTo(BigDecimal("100.0000"))
        }

        @Test
        fun `test simple up check result`() {
            assertThat(
                calculateUptimeFromCheckResults(
                    listOf(
                        CheckResult(
                            status = MonitorStatus.UP,
                            previousStatus = MonitorStatus.PENDING,
                            monitor = testMonitor,
                            pickedUpAt = date_12_12_2024,
                        ),
                        CheckResult(
                            status = MonitorStatus.UP,
                            previousStatus = MonitorStatus.UP,
                            monitor = testMonitor,
                            pickedUpAt = date_12_12_2024.plusSeconds(60 * 60 * 12),
                        ),
                    ),
                    date_12_12_2024,
                    date_13_12_2024,
                ),
            ).isEqualTo(BigDecimal("100.0000"))
        }

        @Test
        fun `test 1 up and 1 down check result`() {
            assertThat(
                calculateUptimeFromCheckResults(
                    listOf(
                        CheckResult(
                            status = MonitorStatus.UP,
                            previousStatus = MonitorStatus.PENDING,
                            monitor = testMonitor,
                            pickedUpAt = date_12_12_2024,
                        ),
                        CheckResult(
                            status = MonitorStatus.DOWN,
                            previousStatus = MonitorStatus.UP,
                            monitor = testMonitor,
                            pickedUpAt = date_12_12_2024.plusSeconds(60 * 60 * 12),
                        ),
                    ),
                    date_12_12_2024,
                    date_13_12_2024,
                ),
            ).isEqualTo(BigDecimal("100.0000"))
        }

        @Test
        fun `test up - down check result 50 percent uptime`() {
            assertThat(
                calculateUptimeFromCheckResults(
                    listOf(
                        CheckResult(
                            status = MonitorStatus.UP,
                            previousStatus = MonitorStatus.PENDING,
                            monitor = testMonitor,
                            pickedUpAt = date_12_12_2024,
                        ),
                        CheckResult(
                            status = MonitorStatus.DOWN,
                            previousStatus = MonitorStatus.UP,
                            monitor = testMonitor,
                            pickedUpAt = date_12_12_2024.plusSeconds(60 * 60 * 12).minusNanos(1),
                        ),
                        CheckResult(
                            status = MonitorStatus.DOWN,
                            previousStatus = MonitorStatus.DOWN,
                            monitor = testMonitor,
                            pickedUpAt = date_12_12_2024.plusSeconds(60 * 60 * 12),
                        ),
                        CheckResult(
                            status = MonitorStatus.DOWN,
                            previousStatus = MonitorStatus.DOWN,
                            monitor = testMonitor,
                            pickedUpAt = date_13_12_2024.minusNanos(1),
                        ),
                    ),
                    date_12_12_2024,
                    date_13_12_2024,
                ),
            ).isEqualTo(BigDecimal("50.0000"))
        }

        @Test
        fun `test up - down check result 25 percent uptime`() {
            assertThat(
                calculateUptimeFromCheckResults(
                    listOf(
                        CheckResult(
                            status = MonitorStatus.UP,
                            previousStatus = MonitorStatus.PENDING,
                            monitor = testMonitor,
                            pickedUpAt = date_12_12_2024,
                        ),
                        CheckResult(
                            status = MonitorStatus.DOWN,
                            previousStatus = MonitorStatus.UP,
                            monitor = testMonitor,
                            pickedUpAt = date_12_12_2024.plusSeconds(60 * 60 * 6).minusNanos(1),
                        ),
                        CheckResult(
                            status = MonitorStatus.DOWN,
                            previousStatus = MonitorStatus.DOWN,
                            monitor = testMonitor,
                            pickedUpAt = date_12_12_2024.plusSeconds(60 * 60 * 6),
                        ),
                        CheckResult(
                            status = MonitorStatus.DOWN,
                            previousStatus = MonitorStatus.DOWN,
                            monitor = testMonitor,
                            pickedUpAt = date_13_12_2024.minusNanos(1),
                        ),
                    ),
                    date_12_12_2024,
                    date_13_12_2024,
                ),
            ).isEqualTo(BigDecimal("25.0000"))
        }

        @Test
        fun `test up - down - up check result 50 percent uptime`() {
            assertThat(
                calculateUptimeFromCheckResults(
                    listOf(
                        CheckResult(
                            status = MonitorStatus.UP,
                            previousStatus = MonitorStatus.PENDING,
                            monitor = testMonitor,
                            pickedUpAt = date_12_12_2024,
                        ),
                        CheckResult(
                            status = MonitorStatus.DOWN,
                            previousStatus = MonitorStatus.UP,
                            monitor = testMonitor,
                            pickedUpAt = date_12_12_2024.plusSeconds(60 * 60 * 6).minusNanos(1),
                        ),
                        CheckResult(
                            status = MonitorStatus.DOWN,
                            previousStatus = MonitorStatus.DOWN,
                            monitor = testMonitor,
                            pickedUpAt = date_12_12_2024.plusSeconds(60 * 60 * 6),
                        ),
                        CheckResult(
                            status = MonitorStatus.DOWN,
                            previousStatus = MonitorStatus.DOWN,
                            monitor = testMonitor,
                            pickedUpAt = date_12_12_2024.plusSeconds(60 * 60 * 18),
                        ),
                        CheckResult(
                            status = MonitorStatus.UP,
                            previousStatus = MonitorStatus.DOWN,
                            monitor = testMonitor,
                            pickedUpAt = date_12_12_2024.plusSeconds(60 * 60 * 18).plusNanos(1),
                        ),
                        CheckResult(
                            status = MonitorStatus.UP,
                            previousStatus = MonitorStatus.UP,
                            monitor = testMonitor,
                            pickedUpAt = date_12_12_2024.plusSeconds(60 * 60 * 18).plusSeconds(60),
                        ),
                        CheckResult(
                            status = MonitorStatus.UP,
                            previousStatus = MonitorStatus.UP,
                            monitor = testMonitor,
                            pickedUpAt = date_13_12_2024.minusNanos(1),
                        ),
                    ),
                    date_12_12_2024,
                    date_13_12_2024,
                ),
            ).isEqualTo(BigDecimal("50.0000"))
        }

        @Test
        fun `test down - up - down check result 50 percent uptime`() {
            assertThat(
                calculateUptimeFromCheckResults(
                    listOf(
                        CheckResult(
                            status = MonitorStatus.DOWN,
                            previousStatus = MonitorStatus.PENDING,
                            monitor = testMonitor,
                            pickedUpAt = date_12_12_2024,
                        ),
                        CheckResult(
                            status = MonitorStatus.DOWN,
                            previousStatus = MonitorStatus.DOWN,
                            monitor = testMonitor,
                            pickedUpAt = date_12_12_2024.plusSeconds(60 * 60 * 6),
                        ),
                        CheckResult(
                            status = MonitorStatus.UP,
                            previousStatus = MonitorStatus.DOWN,
                            monitor = testMonitor,
                            pickedUpAt = date_12_12_2024.plusSeconds(60 * 60 * 6).plusSeconds(60),
                        ),
                        CheckResult(
                            status = MonitorStatus.UP,
                            previousStatus = MonitorStatus.UP,
                            monitor = testMonitor,
                            pickedUpAt = date_12_12_2024.plusSeconds(60 * 60 * 7),
                        ),
                        CheckResult(
                            status = MonitorStatus.DOWN,
                            previousStatus = MonitorStatus.UP,
                            monitor = testMonitor,
                            pickedUpAt = date_12_12_2024.plusSeconds(60 * 60 * 18).minusNanos(1),
                        ),
                        CheckResult(
                            status = MonitorStatus.DOWN,
                            previousStatus = MonitorStatus.DOWN,
                            monitor = testMonitor,
                            pickedUpAt = date_13_12_2024.minusNanos(1),
                        ),
                    ),
                    date_12_12_2024,
                    date_13_12_2024,
                ),
            ).isEqualTo(BigDecimal("50.0000"))
        }
    }

    @Nested
    @DisplayName("calculateHistoricalUptime")
    inner class CalculateHistoricalUptime {

        private val date_12_12_2024 = LocalDate.of(2020, 12, 12)

        @Test
        fun `test empty list`() {
            assertThat(calculateHistoricalUptime(listOf(), TimeOption.THREE_DAYS)).isEqualTo(BigDecimal("100.0000"))
        }

        @Test
        fun `test incorrect list`() {
            assertThat(
                calculateHistoricalUptime(
                    listOf(
                        HistoricalDayUptime(
                            monitor = testMonitor,
                            date = date_12_12_2024,
                            uptime = BigDecimal("100.0000"),
                        ),
                    ),
                    TimeOption.THREE_DAYS,
                ),
            ).isEqualTo(BigDecimal("100.0000"))
        }

        @Test
        fun `test 100 uptime`() {
            assertThat(
                calculateHistoricalUptime(
                    listOf(
                        HistoricalDayUptime(
                            monitor = testMonitor,
                            date = date_12_12_2024,
                            uptime = BigDecimal("100"),
                        ),
                        HistoricalDayUptime(
                            monitor = testMonitor,
                            date = date_12_12_2024.plusDays(1),
                            uptime = BigDecimal("100"),
                        ),
                        HistoricalDayUptime(
                            monitor = testMonitor,
                            date = date_12_12_2024.plusDays(2),
                            uptime = BigDecimal("100"),
                        ),
                    ),
                    TimeOption.THREE_DAYS,
                ),
            ).isEqualTo(BigDecimal("100.0000"))
        }

        @Test
        fun `test 66 6667 uptime`() {
            assertThat(
                calculateHistoricalUptime(
                    listOf(
                        HistoricalDayUptime(
                            monitor = testMonitor,
                            date = date_12_12_2024,
                            uptime = BigDecimal("100"),
                        ),
                        HistoricalDayUptime(
                            monitor = testMonitor,
                            date = date_12_12_2024.plusDays(1),
                            uptime = BigDecimal("100"),
                        ),
                        HistoricalDayUptime(
                            monitor = testMonitor,
                            date = date_12_12_2024.plusDays(2),
                            uptime = BigDecimal("0"),
                        ),
                    ),
                    TimeOption.THREE_DAYS,
                ),
            ).isEqualTo(BigDecimal("66.6667"))
        }

        @Test
        fun `test 66 6667 uptime split`() {
            assertThat(
                calculateHistoricalUptime(
                    listOf(
                        HistoricalDayUptime(
                            monitor = testMonitor,
                            date = date_12_12_2024,
                            uptime = BigDecimal("100"),
                        ),
                        HistoricalDayUptime(
                            monitor = testMonitor,
                            date = date_12_12_2024.plusDays(1),
                            uptime = BigDecimal("50"),
                        ),
                        HistoricalDayUptime(
                            monitor = testMonitor,
                            date = date_12_12_2024.plusDays(2),
                            uptime = BigDecimal("50"),
                        ),
                    ),
                    TimeOption.THREE_DAYS,
                ),
            ).isEqualTo(BigDecimal("66.6667"))
        }

        @Test
        fun `test 50 uptime`() {
            assertThat(
                calculateHistoricalUptime(
                    listOf(
                        HistoricalDayUptime(
                            monitor = testMonitor,
                            date = date_12_12_2024,
                            uptime = BigDecimal("100"),
                        ),
                        HistoricalDayUptime(
                            monitor = testMonitor,
                            date = date_12_12_2024.plusDays(1),
                            uptime = BigDecimal("50"),
                        ),
                        HistoricalDayUptime(
                            monitor = testMonitor,
                            date = date_12_12_2024.plusDays(2),
                            uptime = BigDecimal("0"),
                        ),
                    ),
                    TimeOption.THREE_DAYS,
                ),
            ).isEqualTo(BigDecimal("50.0000"))
        }
    }
}
