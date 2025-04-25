package org.poweruptime.backend.monitor.checker

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.poweruptime.backend.core.BaseTestWithReusingContainers
import org.poweruptime.backend.core.ModelFactory
import org.poweruptime.backend.features.monitor.checker.ssl.SSLCertificateMonitorChecker
import org.poweruptime.backend.features.monitor.checker.ssl.SSLCertificateMonitorCheckerData
import org.poweruptime.backend.features.team.service.TeamSettingService
import org.springframework.beans.factory.annotation.Autowired

class SSLCertificateMonitorCheckerTest(
    @Autowired private val teamSettingService: TeamSettingService
) : BaseTestWithReusingContainers() {
    private val sslCertificateMonitorChecker = SSLCertificateMonitorChecker(teamSettingService)

    @Test
    fun `test if simple works`(): Unit = sslCertificateMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            SSLCertificateMonitorCheckerData(
                url = "https://playground.dafnik.me",
                validDaysLeft = 30,
            ),
        ),
    ).let {
        assertThat(it.isUp).isTrue()
        assertThat(it.title).isEqualTo("All certificates valid")
    }

    @Test
    fun `test if simple without validDaysLeft works`(): Unit = sslCertificateMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            SSLCertificateMonitorCheckerData(url = "https://playground.dafnik.me"),
        ),
    ).let {
        assertThat(it.isUp).isTrue()
        assertThat(it.title).isEqualTo("All certificates valid")
    }

    @Test
    fun `test if simple fails with wrong validDaysLeft`(): Unit = sslCertificateMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            SSLCertificateMonitorCheckerData(
                url = "https://playground.dafnik.me",
                validDaysLeft = 600,
            ),
        ),
    ).let {
        assertThat(it.isUp).isFalse()
        assertThat(it.title).isEqualTo("Certificate valid, but expiry check failed")
    }

    @Test
    fun `test if not existing fails`(): Unit = sslCertificateMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            SSLCertificateMonitorCheckerData(
                url = "https://not-exisiting.dafnik.me",
            ),
        ),
    ).let {
        assertThat(it.isUp).isFalse()
        assertThat(it.title).isEqualTo("Certificate trust error")
    }

    @Test
    fun `test if expired fails`(): Unit = sslCertificateMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            SSLCertificateMonitorCheckerData(
                url = "https://expired.badssl.com/",
            ),
        ),
    ).let {
        assertThat(it.isUp).isFalse()
    }

    @Test
    fun `test if wrong host fails`(): Unit = sslCertificateMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            SSLCertificateMonitorCheckerData(
                url = "https://wrong.host.badssl.com/",
                validDaysLeft = 30,
            ),
        ),
    ).let {
        assertThat(it.isUp).isFalse()
        assertThat(it.title).isEqualTo("Certificate trust error")
    }

    @Test
    fun `test if self signed fails`(): Unit = sslCertificateMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            SSLCertificateMonitorCheckerData(
                url = "https://self-signed.badssl.com/",
                validDaysLeft = 0,
            ),
        ),
    ).let {
        assertThat(it.isUp).isFalse()
        assertThat(it.title).isEqualTo("Certificate trust error")
    }

//    @Test
//    fun `test if revoked works`(): Unit = sslCertificateMonitorChecker.execute(
//        ModelFactory.getTestMonitor(
//            SSLCertificateMonitorCheckerData(
//                url = "https://revoked.badssl.com/",
//                validDaysLeft = 1,
//            ),
//        ),
//    ).let {
//        assertThat(it.isUp).isTrue()
//    }

    @Test
    fun `test if untrusted-root fails`(): Unit = sslCertificateMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            SSLCertificateMonitorCheckerData(
                url = "https://untrusted-root.badssl.com/",
            ),
        ),
    ).let {
        assertThat(it.isUp).isFalse()
        assertThat(it.title).isEqualTo("Certificate trust error")
    }
}
