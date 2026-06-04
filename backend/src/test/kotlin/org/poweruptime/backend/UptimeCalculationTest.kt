package org.poweruptime.backend

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.poweruptime.backend.features.monitor.core.TimeOption
import org.poweruptime.backend.features.monitor.model.MonitorUptimeEventRecord
import org.poweruptime.backend.features.monitor.model.MonitorUptimeEventStatus
import org.poweruptime.backend.features.monitor.service.calculateUptimeFromEvents
import java.math.BigDecimal
import java.time.Instant

class UptimeCalculationTest {
    private val start = Instant.parse("2024-12-12T00:00:00Z")
    private val end = start.plusSeconds(24 * 60 * 60)
    private var id = 1UL

    private fun event(status: MonitorUptimeEventStatus, effectiveAt: Instant) = MonitorUptimeEventRecord(
        id = id++,
        monitorId = 1UL,
        effectiveAt = effectiveAt,
        status = status,
    )

    @Test
    fun `missing evidence defaults to uptime`() {
        assertThat(calculateUptimeFromEvents(emptyList(), start = start, end = end))
            .isEqualTo(BigDecimal("100.000"))
    }

    @Test
    fun `empty window has no percentage`() {
        assertThat(calculateUptimeFromEvents(emptyList(), start = start, end = start)).isNull()
    }

    @Test
    fun `down boundary starts outage immediately and includes tail`() {
        assertThat(
            calculateUptimeFromEvents(
                events = listOf(event(MonitorUptimeEventStatus.DOWN, start.plusSeconds(12 * 60 * 60))),
                start = start,
                end = end,
            ),
        ).isEqualTo(BigDecimal("50.000"))
    }

    @Test
    fun `status at window start includes outage head`() {
        assertThat(
            calculateUptimeFromEvents(
                events = emptyList(),
                statusAtStart = MonitorUptimeEventStatus.DOWN,
                start = start,
                end = end,
            ),
        ).isEqualTo(BigDecimal("0.000"))
    }

    @Test
    fun `recovery boundary ends outage immediately`() {
        assertThat(
            calculateUptimeFromEvents(
                events = listOf(
                    event(MonitorUptimeEventStatus.DOWN, start.plusSeconds(6 * 60 * 60)),
                    event(MonitorUptimeEventStatus.UP, start.plusSeconds(18 * 60 * 60)),
                ),
                start = start,
                end = end,
            ),
        ).isEqualTo(BigDecimal("50.000"))
    }

    @Test
    fun `pause maintenance and explicit restart are optimistic recovery boundaries`() {
        assertThat(
            calculateUptimeFromEvents(
                events = listOf(event(MonitorUptimeEventStatus.UP, start.plusSeconds(6 * 60 * 60))),
                statusAtStart = MonitorUptimeEventStatus.DOWN,
                start = start,
                end = end,
            ),
        ).isEqualTo(BigDecimal("75.000"))
    }

    @Test
    fun `events at exact end do not affect closed window`() {
        assertThat(
            calculateUptimeFromEvents(
                events = listOf(event(MonitorUptimeEventStatus.DOWN, end)),
                start = start,
                end = end,
            ),
        ).isEqualTo(BigDecimal("100.000"))
    }

    @Test
    fun `one year is exactly 365 days`() {
        assertThat(TimeOption.ONE_YEAR.hours).isEqualTo(24 * 365)
    }

    @Test
    fun `long range cards use explicit trailing hour windows`() {
        assertThat(TimeOption.THREE_DAYS.hours).isEqualTo(24 * 3)
        assertThat(TimeOption.ONE_WEEK.hours).isEqualTo(24 * 7)
        assertThat(TimeOption.ONE_MONTH.hours).isEqualTo(24 * 31)
        assertThat(TimeOption.ONE_YEAR.hours).isEqualTo(24 * 365)
    }
}
