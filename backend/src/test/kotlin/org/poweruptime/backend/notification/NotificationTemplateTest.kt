package org.poweruptime.backend.notification

import org.assertj.core.api.Assertions
import org.junit.jupiter.api.Test
import org.poweruptime.backend.core.BaseTestWithReusingContainers
import org.poweruptime.backend.core.ModelFactory
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.model.SubNotificationJoinMethodNotificationCheckResultAndMonitorRecord
import org.poweruptime.backend.features.notification.service.NotificationTemplateService
import org.springframework.beans.factory.annotation.Autowired

class NotificationTemplateTest(
    @Autowired val notificationTemplateService: NotificationTemplateService
) : BaseTestWithReusingContainers() {
    @Test
    fun `test email template`() {
        val title = """ this is a "test" """

        val monitor = ModelFactory.getTestMonitor()
        val method = ModelFactory.getTestNotificationMethod(type = NotificationMethodType.EMAIL)

        val checkResult = ModelFactory.getTestCheckResult(monitorId = monitor.id, title = title)
        val notification = ModelFactory.getTestNotification(checkResultId = checkResult.id, title = title)
        val template = notificationTemplateService.getRenderedNotification(
            SubNotificationJoinMethodNotificationCheckResultAndMonitorRecord(
                subNotification = ModelFactory.getTestSubNotification(
                    notificationId = notification.id,
                    methodId = method.id,
                    title = title,
                ),
                method = method,
                notification = notification,
                checkResult = checkResult,
                monitor = monitor,
            ),
        )

        Assertions.assertThat(template.title).isEqualTo("""✅ UP: Test -  this is a "test" """)
        Assertions.assertThat(template.body.lines().first()).isEqualTo("""<p><strong>Service Name</strong></p>""")
        Assertions.assertThat(template.body.lines()[1]).isEqualTo("""<p>Test</p>""")

        println("""Title: "${template.title}" """)
        println("""Body: "${template.body}" """)
    }
}
