package org.poweruptime.backend.notification

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.poweruptime.backend.core.BaseTestWithReusingContainers
import org.poweruptime.backend.core.ModelFactory
import org.poweruptime.backend.features.monitor.model.CheckResultRecord
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.service.CheckResultService
import org.poweruptime.backend.features.notification.AppriseSender
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.model.NotificationMethodData
import org.poweruptime.backend.features.notification.model.NotificationMethodRecord
import org.poweruptime.backend.features.notification.model.NotificationRecord
import org.poweruptime.backend.features.notification.model.SubNotificationJoinMethodNotificationCheckResultAndMonitorRecord
import org.poweruptime.backend.features.notification.model.SubNotificationRecord
import org.poweruptime.backend.features.notification.notificationMethods.slack.SlackNotificationMethodDataRecord
import org.poweruptime.backend.features.notification.service.INotificationMethodDataService
import org.poweruptime.backend.features.notification.service.NotificationTemplateService
import org.poweruptime.backend.features.tempNotification.TempNotificationService
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.client.RestClient
import org.testcontainers.containers.GenericContainer
import org.testcontainers.containers.wait.strategy.Wait
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.utility.DockerImageName

class AppriseIntegrationTests(
    @Autowired private val restClient: RestClient,
    @Autowired private val notificationTemplateService: NotificationTemplateService,
    @Autowired private val checkResultService: CheckResultService,
    @Autowired private val tempNotificationService: TempNotificationService,
) : BaseTestWithReusingContainers() {
    private lateinit var mockNotificationMethodDataService:
        MockNotificationMethodDataService

    private lateinit var appriseSender: AppriseSender

    companion object {
        private val appriseImageName: DockerImageName =
            DockerImageName.parse("caronc/apprise:v1.5.0") // renovate

        @Container
        @JvmStatic
        val appriseContainer: GenericContainer<*> = GenericContainer(appriseImageName)
            .withExposedPorts(8000)
            .withEnv(mapOf("APPRISE_STATEFUL_MODE" to "disabled"))
            .withReuse(true)
            .waitingFor(Wait.forHttp("/").forStatusCode(200))
    }

    private fun getAppriseUrl() = "http://localhost:${appriseContainer.getMappedPort(8000)}"

    @BeforeEach
    fun setUp() {
        mockNotificationMethodDataService =
            MockNotificationMethodDataService()

        appriseSender = AppriseSender(
            tempNotificationsEnabled = false,
            appriseUrl = getAppriseUrl(),
            restClient = restClient,
            notificationMethodDataService =
            mockNotificationMethodDataService,
            notificationTemplateService = notificationTemplateService,
            checkResultService = checkResultService,
            tempNotificationService = tempNotificationService,
        )

        setupDefaultMockData()
    }

    private fun setupDefaultMockData() {
        mockNotificationMethodDataService.withDefaultReturnValue(
            SlackNotificationMethodDataRecord(
                url = "slackwebhook.com",
            ),
        )
    }

    @Nested
    @DisplayName("send() method")
    inner class SendMethod {
        @Test
        @DisplayName(
            "should return success with sentAt when notification sent to Apprise",
        )
        fun shouldReturnSuccessWhenNotificationSent() {
            // Arrange
            val monitor = ModelFactory.getTestMonitor(
                name = "Test Monitor",
                status = MonitorStatus.UP,
            )
            val checkResult = ModelFactory.getTestCheckResult(
                monitorId = monitor.id,
                status = MonitorStatus.UP,
            )
            val notification = ModelFactory.getTestNotification(
                title = "Test Notification",
                checkResultId = checkResult.id,
                status = checkResult.status,
                monitorId = monitor.id,
                publicCheckResultId = checkResult.publicId,
            )
            val method = ModelFactory.getTestNotificationMethod(
                type = NotificationMethodType.SLACK,
                teamId = 1UL,
            )
            val subNotification = ModelFactory.getTestSubNotification(
                notificationId = notification.id,
                methodId = method.id,
                title = "Test Notification",
            )

            val join = createSubNotificationJoin(
                subNotification = subNotification,
                method = method,
                notification = notification,
                checkResult = checkResult,
                monitor = monitor,
            )

            val result = appriseSender.send(join)

            assertNotNull(result.sentAt)
            assertNull(result.error)
            assertEquals(1, mockNotificationMethodDataService.getCallCount())
            assertEquals(method.id, mockNotificationMethodDataService.getLastId())
            assertEquals(
                NotificationMethodType.SLACK,
                mockNotificationMethodDataService.getLastType(),
            )
        }

        @Test
        @DisplayName(
            "should handle UP status correctly",
        )
        fun shouldHandleUpStatus() {
            // Arrange
            val monitor = ModelFactory.getTestMonitor(
                name = "Healthy Monitor",
                status = MonitorStatus.UP,
            )
            val checkResult = ModelFactory.getTestCheckResult(
                monitorId = monitor.id,
                status = MonitorStatus.UP,
            )
            val notification = ModelFactory.getTestNotification(
                title = "UP Notification",
                checkResultId = checkResult.id,
                status = checkResult.status,
                monitorId = monitor.id,
                publicCheckResultId = checkResult.publicId,
            )
            val method = ModelFactory.getTestNotificationMethod(
                type = NotificationMethodType.SLACK,
                teamId = 1UL,
            )
            val subNotification = ModelFactory.getTestSubNotification(
                notificationId = notification.id,
                methodId = method.id,
                title = "UP Notification",
            )

            val join = createSubNotificationJoin(
                subNotification = subNotification,
                method = method,
                notification = notification,
                checkResult = checkResult,
                monitor = monitor,
            )

            val result = appriseSender.send(join)

            assertNull(result.error)
            assertNotNull(result.sentAt)
        }

        @Test
        @DisplayName(
            "should handle DOWN status correctly",
        )
        fun shouldHandleDownStatus() {
            // Arrange
            val monitor = ModelFactory.getTestMonitor(
                name = "Failed Monitor",
                status = MonitorStatus.DOWN,
            )
            val checkResult = ModelFactory.getTestCheckResult(
                monitorId = monitor.id,
                status = MonitorStatus.DOWN,
            )
            val notification = ModelFactory.getTestNotification(
                title = "DOWN Notification",
                checkResultId = checkResult.id,
                status = checkResult.status,
                monitorId = monitor.id,
                publicCheckResultId = checkResult.publicId,
            )
            val method = ModelFactory.getTestNotificationMethod(
                type = NotificationMethodType.SLACK,
                teamId = 1UL,
            )
            val subNotification = ModelFactory.getTestSubNotification(
                notificationId = notification.id,
                methodId = method.id,
                title = "DOWN Notification",
            )

            val join = createSubNotificationJoin(
                subNotification = subNotification,
                method = method,
                notification = notification,
                checkResult = checkResult,
                monitor = monitor,
            )

            val result = appriseSender.send(join)

            assertNull(result.error)
            assertNotNull(result.sentAt)
        }

        @Test
        @DisplayName(
            "should call NotificationMethodDataService with correct parameters",
        )
        fun shouldCallServiceWithCorrectParameters() {
            // Arrange
            val monitor = ModelFactory.getTestMonitor(
                name = "Service Verification Monitor",
                status = MonitorStatus.UP,
            )
            val checkResult = ModelFactory.getTestCheckResult(
                monitorId = monitor.id,
                status = MonitorStatus.UP,
            )
            val notification = ModelFactory.getTestNotification(
                title = "Service Test",
                checkResultId = checkResult.id,
                status = checkResult.status,
                monitorId = monitor.id,
                publicCheckResultId = checkResult.publicId,
            )
            val method = ModelFactory.getTestNotificationMethod(
                type = NotificationMethodType.SLACK,
                teamId = 1UL,
            )
            val subNotification = ModelFactory.getTestSubNotification(
                notificationId = notification.id,
                methodId = method.id,
                title = "Service Test",
            )

            mockNotificationMethodDataService.reset()

            val join = createSubNotificationJoin(
                subNotification = subNotification,
                method = method,
                notification = notification,
                checkResult = checkResult,
                monitor = monitor,
            )

            appriseSender.send(join)

            assertEquals(1, mockNotificationMethodDataService.getCallCount())
            assertEquals(method.id, mockNotificationMethodDataService.getLastId())
            assertEquals(
                NotificationMethodType.SLACK,
                mockNotificationMethodDataService.getLastType(),
            )
        }
    }

    @Nested
    @DisplayName("notification method types")
    inner class NotificationMethodTypes {
        @Test
        @DisplayName(
            "should send via email method",
        )
        fun shouldSendViaEmail() {
            // Arrange
            val monitor = ModelFactory.getTestMonitor(
                name = "Email Monitor",
                status = MonitorStatus.UP,
            )
            val checkResult = ModelFactory.getTestCheckResult(
                monitorId = monitor.id,
                status = MonitorStatus.UP,
            )
            val notification = ModelFactory.getTestNotification(
                title = "Email Notification",
                checkResultId = checkResult.id,
                status = checkResult.status,
                monitorId = monitor.id,
                publicCheckResultId = checkResult.publicId,
            )
            val method = ModelFactory.getTestNotificationMethod(
                type = NotificationMethodType.SLACK,
                teamId = 1UL,
            )
            val subNotification = ModelFactory.getTestSubNotification(
                notificationId = notification.id,
                methodId = method.id,
                title = "Email Notification",
            )

            val join = createSubNotificationJoin(
                subNotification = subNotification,
                method = method,
                notification = notification,
                checkResult = checkResult,
                monitor = monitor,
            )

            val result = appriseSender.send(join)

            assertNull(result.error)
            assertNotNull(result.sentAt)
        }

        @Test
        @DisplayName(
            "should send via Slack method",
        )
        fun shouldSendViaSlack() {
            // Arrange
            val monitor = ModelFactory.getTestMonitor(
                name = "Slack Monitor",
                status = MonitorStatus.UP,
            )
            val checkResult = ModelFactory.getTestCheckResult(
                monitorId = monitor.id,
                status = MonitorStatus.UP,
            )
            val notification = ModelFactory.getTestNotification(
                title = "Slack Notification",
                checkResultId = checkResult.id,
                status = checkResult.status,
                monitorId = monitor.id,
                publicCheckResultId = checkResult.publicId,
            )
            val method = ModelFactory.getTestNotificationMethod(
                type = NotificationMethodType.SLACK,
                teamId = 1UL,
            )
            val subNotification = ModelFactory.getTestSubNotification(
                notificationId = notification.id,
                methodId = method.id,
                title = "Slack Notification",
            )

            val join = createSubNotificationJoin(
                subNotification = subNotification,
                method = method,
                notification = notification,
                checkResult = checkResult,
                monitor = monitor,
            )

            val result = appriseSender.send(join)

            assertNull(result.error)
            assertNotNull(result.sentAt)
        }
    }

    @Nested
    @DisplayName("multiple notifications")
    inner class MultipleNotifications {
        @Test
        @DisplayName(
            "should send multiple notifications independently",
        )
        fun shouldSendMultipleNotifications() {
            // Arrange
            val monitor = ModelFactory.getTestMonitor(
                name = "Multi Monitor",
                status = MonitorStatus.UP,
            )
            val checkResult = ModelFactory.getTestCheckResult(
                monitorId = monitor.id,
                status = MonitorStatus.UP,
            )
            val notification1 = ModelFactory.getTestNotification(
                title = "Notification 1",
                checkResultId = checkResult.id,
                status = checkResult.status,
                monitorId = monitor.id,
                publicCheckResultId = checkResult.publicId,
            )
            val notification2 = ModelFactory.getTestNotification(
                title = "Notification 2",
                checkResultId = checkResult.id,
                status = checkResult.status,
                monitorId = monitor.id,
                publicCheckResultId = checkResult.publicId,
            )
            val method1 = ModelFactory.getTestNotificationMethod(
                type = NotificationMethodType.SLACK,
                teamId = 1UL,
            )
            val method2 = ModelFactory.getTestNotificationMethod(
                type = NotificationMethodType.SLACK,
                teamId = 1UL,
            )
            val subNotification1 = ModelFactory.getTestSubNotification(
                notificationId = notification1.id,
                methodId = method1.id,
                title = "Notification 1",
            )
            val subNotification2 = ModelFactory.getTestSubNotification(
                notificationId = notification2.id,
                methodId = method2.id,
                title = "Notification 2",
            )

            val join1 = createSubNotificationJoin(
                subNotification = subNotification1,
                method = method1,
                notification = notification1,
                checkResult = checkResult,
                monitor = monitor,
            )
            val join2 = createSubNotificationJoin(
                subNotification = subNotification2,
                method = method2,
                notification = notification2,
                checkResult = checkResult,
                monitor = monitor,
            )

            val result1 = appriseSender.send(join1)
            val result2 = appriseSender.send(join2)

            assertNull(result1.error)
            assertNotNull(result1.sentAt)
            assertNull(result2.error)
            assertNotNull(result2.sentAt)
            assertEquals(2, mockNotificationMethodDataService.getCallCount())
        }
    }

    private fun createSubNotificationJoin(
        subNotification: SubNotificationRecord,
        method: NotificationMethodRecord,
        notification: NotificationRecord,
        checkResult: CheckResultRecord,
        monitor: MonitorRecord,
    ): SubNotificationJoinMethodNotificationCheckResultAndMonitorRecord =
        SubNotificationJoinMethodNotificationCheckResultAndMonitorRecord(
            subNotification = subNotification,
            method = method,
            notification = notification,
            checkResult = checkResult,
            monitor = monitor,
        )
}

class MockNotificationMethodDataService : INotificationMethodDataService {
    private val returnValues =
        mutableMapOf<Pair<ULong, NotificationMethodType>, NotificationMethodData>()
    private var defaultReturnValue: NotificationMethodData = SlackNotificationMethodDataRecord(
        url = "slackwebhook.com",
    )
    private var defaultException: Exception? = null
    private var callCount = 0
    private val callHistory =
        mutableListOf<Pair<ULong, NotificationMethodType>>()

    fun withReturnValue(
        id: ULong,
        type: NotificationMethodType,
        data: NotificationMethodData,
    ): MockNotificationMethodDataService {
        returnValues[id to type] = data
        return this
    }

    fun withDefaultReturnValue(data: NotificationMethodData): MockNotificationMethodDataService {
        defaultReturnValue = data
        return this
    }

    fun setupException(exception: Exception) {
        defaultException = exception
    }

    fun getCallCount(): Int = callCount

    fun getCallHistory(): List<Pair<ULong, NotificationMethodType>> = callHistory.toList()

    fun getLastId(): ULong? = callHistory.lastOrNull()?.first

    fun getLastType(): NotificationMethodType? = callHistory.lastOrNull()?.second

    fun reset() {
        returnValues.clear()
        defaultReturnValue = SlackNotificationMethodDataRecord(
            url = "slackwebhook.com",
        )
        defaultException = null
        callCount = 0
        callHistory.clear()
    }

    override fun findByIdAndType(id: ULong, type: NotificationMethodType): NotificationMethodData {
        callCount++
        callHistory.add(id to type)

        if (defaultException != null) {
            throw defaultException!!
        }

        val key = id to type
        return returnValues[key] ?: defaultReturnValue
    }
}
