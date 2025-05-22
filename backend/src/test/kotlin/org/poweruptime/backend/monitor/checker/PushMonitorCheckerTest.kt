package org.poweruptime.backend.monitor.checker

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.poweruptime.backend.core.BaseTestWithReusingContainers
import org.poweruptime.backend.core.ModelFactory
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.NANO_ID_MAX_LENGTH
import org.poweruptime.backend.core.utils.RandomGenerator
import org.poweruptime.backend.features.monitor.checker.push.PushMonitorChecker
import org.poweruptime.backend.features.monitor.checker.push.PushMonitorCheckerEntry
import org.poweruptime.backend.features.monitor.checker.push.PushMonitorData
import org.poweruptime.backend.features.monitor.domain.IPushMonitorCheckerEntryRepository
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.team.service.TeamSettingService
import org.springframework.beans.factory.annotation.Autowired
import java.time.Instant

class PushMonitorCheckerTest(
    @Autowired private val teamSettingService: TeamSettingService
) : BaseTestWithReusingContainers() {
    inner class PushMonitorCheckerEntryRepositoryMock : IPushMonitorCheckerEntryRepository {
        private val pushes = mutableListOf<PushMonitorCheckerEntry>()

        override fun getLatestByPushIdAndBetweenNowAndThen(
            pushId: String,
            then: Instant
        ): PushMonitorCheckerEntry? = pushes.filter {
            it.pushId == pushId && (it.createdAt.isAfter(then) || it.createdAt == then)
        }.maxByOrNull { it.createdAt }

        fun save(pushId: String, status: MonitorStatus, createdAt: Instant = Instant.now()) {
            pushes.add(
                PushMonitorCheckerEntry(
                    pushId = pushId,
                    status = status,
                    title = if (status == MonitorStatus.UP) "OK" else "Error",
                ).apply {
                    id = RandomGenerator.nanoId(NANO_ID_MAX_LENGTH)
                    this.createdAt = createdAt
                },
            )
        }
    }

    private fun getPushId() = RandomGenerator.nanoId(Database.MAX_PUSH_ID_LENGTH)

    @Test
    fun `test if simple works`(): Unit = getPushId().let { pushId ->
        PushMonitorChecker(
            PushMonitorCheckerEntryRepositoryMock().apply {
                save(pushId, MonitorStatus.UP)
            },
            teamSettingService,
        ).execute(
            ModelFactory.getTestMonitor(PushMonitorData(pushId = pushId)),
        ).let {
            assertThat(it.isUp).isTrue()
            assertThat(it.title).isEqualTo("OK")
        }
    }

    @Test
    fun `test if simple fails`(): Unit = getPushId().let { pushId ->
        PushMonitorChecker(
            PushMonitorCheckerEntryRepositoryMock().apply {
                save(pushId, MonitorStatus.DOWN)
            },
            teamSettingService,
        ).execute(
            ModelFactory.getTestMonitor(PushMonitorData(pushId = pushId)),
        ).let {
            assertThat(it.isUp).isFalse()
            assertThat(it.title).isEqualTo("Error")
        }
    }

    @Test
    fun `test if at time border works`(): Unit = getPushId().let { pushId ->
        val monitor = ModelFactory.getTestMonitor(PushMonitorData(pushId = pushId))

        PushMonitorChecker(
            PushMonitorCheckerEntryRepositoryMock().apply {
                save(pushId, MonitorStatus.UP, Instant.now().minusSeconds(monitor.testIntervalSeconds - 1L))
            },
            teamSettingService,
        ).execute(monitor).let {
            assertThat(it.isUp).isTrue()
            assertThat(it.title).isEqualTo("OK")
        }
    }

    @Test
    fun `test if at time border works with down`(): Unit = getPushId().let { pushId ->
        val monitor = ModelFactory.getTestMonitor(PushMonitorData(pushId = pushId))

        PushMonitorChecker(
            PushMonitorCheckerEntryRepositoryMock().apply {
                save(pushId, MonitorStatus.DOWN, Instant.now().minusSeconds(monitor.testIntervalSeconds - 1L))
            },
            teamSettingService,
        ).execute(monitor).let {
            assertThat(it.isUp).isFalse()
        }
    }

    @Test
    fun `test if at time border fails`(): Unit = getPushId().let { pushId ->
        val monitor = ModelFactory.getTestMonitor(PushMonitorData(pushId = pushId))

        PushMonitorChecker(
            PushMonitorCheckerEntryRepositoryMock().apply {
                save(pushId, MonitorStatus.UP, Instant.now().minusSeconds(monitor.testIntervalSeconds))
            },
            teamSettingService,
        ).execute(monitor).let {
            assertThat(it.isUp).isFalse()
            assertThat(it.title).isEqualTo("No push detected since last run")
        }
    }

    @Test
    fun `test if multiple works`(): Unit = getPushId().let { pushId ->
        PushMonitorChecker(
            PushMonitorCheckerEntryRepositoryMock().apply {
                save(pushId, MonitorStatus.UP)
                save(pushId, MonitorStatus.DOWN, Instant.now().minusSeconds(10))
                save(pushId, MonitorStatus.UP, Instant.now().minusSeconds(20))
                save(pushId, MonitorStatus.UP, Instant.now().minusSeconds(2000))
            },
            teamSettingService,
        ).execute(
            ModelFactory.getTestMonitor(PushMonitorData(pushId = pushId)),
        ).let {
            assertThat(it.isUp).isTrue()
            assertThat(it.title).isEqualTo("OK")
        }
    }

    @Test
    fun `test if multiple fails`(): Unit = getPushId().let { pushId ->
        PushMonitorChecker(
            PushMonitorCheckerEntryRepositoryMock().apply {
                save(pushId, MonitorStatus.DOWN)
                save(pushId, MonitorStatus.UP, Instant.now().minusSeconds(10))
                save(pushId, MonitorStatus.DOWN, Instant.now().minusSeconds(20))
                save(pushId, MonitorStatus.DOWN, Instant.now().minusSeconds(2000))
            },
            teamSettingService,
        ).execute(
            ModelFactory.getTestMonitor(PushMonitorData(pushId = pushId)),
        ).let {
            assertThat(it.isUp).isFalse()
            assertThat(it.title).isEqualTo("Error")
        }
    }
}
