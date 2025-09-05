package org.poweruptime.backend.monitor.checker

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.poweruptime.backend.core.ModelFactory
import org.poweruptime.backend.features.monitor.checker.ping.PingMonitorChecker
import org.poweruptime.backend.features.monitor.checker.ping.PingMonitorDataRecord
import org.poweruptime.backend.features.monitor.model.MonitorType
import java.time.Duration
import java.time.Instant

class PingMonitorCheckerTest {
    private val pingMonitorChecker = PingMonitorChecker()

    @Test
    fun `test if simple works`(): Unit = pingMonitorChecker.execute(
        ModelFactory.getTestMonitor(MonitorType.PING),
        PingMonitorDataRecord(
            ip = "8.8.8.8",
            port = 53,
        ),
    ).let {
        assertThat(it.isUp).isTrue()
        assertThat(it.title).isEqualTo("Ping successful")
    }

    @Test
    fun `test if simple and timeout works`() {
        val now = Instant.now()
        pingMonitorChecker.execute(
            ModelFactory.getTestMonitor(MonitorType.PING),
            PingMonitorDataRecord(
                ip = "8.8.8.8",
                port = 1234,
            ),
        ).let {
            assertThat(it.isUp).isFalse()
            assertThat(it.title).isEqualTo("Could not ping address")
        }

        assertThat(Duration.between(now, Instant.now()).seconds).isLessThan(5)
    }

    @Test
    fun `test if not existing fails`(): Unit = pingMonitorChecker.execute(
        ModelFactory.getTestMonitor(MonitorType.PING),
        PingMonitorDataRecord(
            ip = "10.0.30.123",
            port = 80,
        ),
    ).let {
        assertThat(it.isUp).isFalse()
        assertThat(it.title).isEqualTo("Could not ping address")
    }
}
