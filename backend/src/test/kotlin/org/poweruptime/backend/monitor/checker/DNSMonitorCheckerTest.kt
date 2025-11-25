package org.poweruptime.backend.monitor.checker

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.poweruptime.backend.core.ModelFactory
import org.poweruptime.backend.features.monitor.checkers.dns.DnsMonitorChecker
import org.poweruptime.backend.features.monitor.checkers.dns.DnsMonitorDataRecord
import org.poweruptime.backend.features.monitor.checkers.dns.DnsMonitorDataType
import org.poweruptime.backend.features.monitor.model.MonitorType

class DNSMonitorCheckerTest {
    private val dnsMonitorChecker = DnsMonitorChecker()

    @Test
    fun `test if simple A record works`(): Unit = dnsMonitorChecker.execute(
        ModelFactory.getTestMonitor(MonitorType.DNS),
        DnsMonitorDataRecord(
            host = "playground.dafnik.me",
            server = "8.8.8.8",
            port = 53,
            type = DnsMonitorDataType.A,
            matches = null,
        ),
    ).let {
        assertThat(it.isUp).isTrue()
        assertThat(it.title).isEqualTo("DNS record(s) found")
    }

    @Test
    fun `test if simple CNAME record works`(): Unit = dnsMonitorChecker.execute(
        ModelFactory.getTestMonitor(MonitorType.DNS),
        DnsMonitorDataRecord(
            host = "playground.dafnik.me",
            server = "8.8.8.8",
            port = 53,
            type = DnsMonitorDataType.CNAME,
            matches = null,
        ),
    ).let {
        assertThat(it.isUp).isTrue()
        assertThat(it.title).isEqualTo("DNS record(s) found")
    }

    @Test
    fun `test if fails simple CNAME record works`(): Unit = dnsMonitorChecker.execute(
        ModelFactory.getTestMonitor(MonitorType.DNS),
        DnsMonitorDataRecord(
            host = "playground_not_exisiting.dafnik.me",
            server = "8.8.8.8",
            port = 53,
            type = DnsMonitorDataType.CNAME,
            matches = null,
        ),
    ).let {
        assertThat(it.isUp).isFalse()
        assertThat(it.title).isEqualTo("DNS record(s) not found")
    }

    @Test
    fun `test not existing DNS server`(): Unit = dnsMonitorChecker.execute(
        ModelFactory.getTestMonitor(MonitorType.DNS),
        DnsMonitorDataRecord(
            host = "playground.dafnik.me",
            server = "223.545.122.123",
            port = 53,
            type = DnsMonitorDataType.CNAME,
            matches = null,
        ),
    ).let {
        assertThat(it.title).isEqualTo("DNS server unreachable")
        assertThat(it.isUp).isFalse()
    }

    @Test
    fun `test if A records work`(): Unit = dnsMonitorChecker.execute(
        ModelFactory.getTestMonitor(MonitorType.DNS),
        DnsMonitorDataRecord(
            host = "playground.dafnik.me",
            server = "8.8.8.8",
            port = 53,
            type = DnsMonitorDataType.A,
            matches = listOf(
                "185.199.109.153",
                "185.199.110.153",
                "185.199.111.153",
                "185.199.108.153",
            ),
        ),
    ).let {
        assertThat(it.isUp).isTrue()
        assertThat(it.title).isEqualTo("DNS record(s) found")
    }

    @Test
    fun `test if CNAME records work`(): Unit = dnsMonitorChecker.execute(
        ModelFactory.getTestMonitor(MonitorType.DNS),
        DnsMonitorDataRecord(
            host = "playground.dafnik.me",
            server = "8.8.8.8",
            port = 53,
            type = DnsMonitorDataType.CNAME,
            matches = listOf("dafnik.github.io."),
        ),
    ).let {
        assertThat(it.isUp).isTrue()
        assertThat(it.title).isEqualTo("DNS record(s) found")
    }

    @Test
    fun `test if fail A records`(): Unit = dnsMonitorChecker.execute(
        ModelFactory.getTestMonitor(MonitorType.DNS),
        DnsMonitorDataRecord(
            host = "playground.dafnik.me",
            server = "8.8.8.8",
            port = 53,
            type = DnsMonitorDataType.A,
            matches = listOf("1.2.3.4"),
        ),
    ).let {
        assertThat(it.isUp).isFalse()
        assertThat(it.title).isEqualTo("DNS record(s) not corresponding with specified matches")
    }

    @Test
    fun `test if fail CNAME records`(): Unit = dnsMonitorChecker.execute(
        ModelFactory.getTestMonitor(MonitorType.DNS),
        DnsMonitorDataRecord(
            host = "playground.dafnik.me",
            server = "8.8.8.8",
            port = 53,
            type = DnsMonitorDataType.CNAME,
            matches = listOf("something.github.io."),
        ),
    ).let {
        assertThat(it.isUp).isFalse()
        assertThat(it.title).isEqualTo("DNS record(s) not corresponding with specified matches")
    }

    @Test
    fun `test if fail CNAME records with working and not working`(): Unit = dnsMonitorChecker.execute(
        ModelFactory.getTestMonitor(MonitorType.DNS),
        DnsMonitorDataRecord(
            host = "playground.dafnik.me",
            server = "8.8.8.8",
            port = 53,
            type = DnsMonitorDataType.CNAME,
            matches = listOf(
                "dafnik.github.io.",
                "something.github.io.",
            ),
        ),
    ).let {
        assertThat(it.isUp).isFalse()
        assertThat(it.title).isEqualTo("DNS record(s) not corresponding with specified matches")
    }
}
