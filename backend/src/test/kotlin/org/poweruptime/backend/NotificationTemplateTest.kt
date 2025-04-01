package org.poweruptime.backend

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.poweruptime.backend.core.BaseTestWithReusingContainers
import org.poweruptime.backend.core.ModelFactory
import org.poweruptime.backend.features.notification.notificationSenders.email.EmailNotificationSenderData
import org.poweruptime.backend.features.notification.service.NotificationTemplateService
import org.springframework.beans.factory.annotation.Autowired

class NotificationTemplateTest(
    @Autowired val notificationTemplateService: NotificationTemplateService
) : BaseTestWithReusingContainers() {
    @Test
    fun `test email template`() {
        val template = notificationTemplateService.getRenderedNotification(
            ModelFactory.getTestNotification(
                title = """ this is a "test" """,
                sender = EmailNotificationSenderData(),
            ),
        )

        assertThat(template.title).isEqualTo("""[Test] [✅ UP]  this is a "test" """)
        assertThat(template.body.lines().first()).isEqualTo("""[Test] [✅ UP]  this is a "test" """)
        assertThat(template.body.lines()[1]).isEqualTo("""Ping: 1000ms""")
        assertThat(template.body.lines().last()).isEqualTo("""Test Message""")

        println("""Title: "${template.title}" """)
        println("""Body: "${template.body}" """)
    }
}
