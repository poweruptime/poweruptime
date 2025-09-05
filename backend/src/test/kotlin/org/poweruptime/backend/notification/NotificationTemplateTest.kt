package org.poweruptime.backend.notification

import org.poweruptime.backend.core.BaseTestWithReusingContainers
import org.poweruptime.backend.features.notification.service.NotificationTemplateService
import org.springframework.beans.factory.annotation.Autowired

class NotificationTemplateTest(
    @Autowired val notificationTemplateService: NotificationTemplateService
) : BaseTestWithReusingContainers() {
//    @Test
//    fun `test email template`() {
//        val template = notificationTemplateService.getRenderedNotification(
//            ModelFactory.getTestSubNotification(
//                notification = ModelFactory.getTestNotification(),
//                title = """ this is a "test" """,
//                sender = EmailNotificationMethodDataRecord(),
//            ),
//        )
//
//        Assertions.assertThat(template.title).isEqualTo("""✅ UP: Test -  this is a "test" """)
//        Assertions.assertThat(template.body.lines().first()).isEqualTo("""<p><strong>Service Name</strong></p>""")
//        Assertions.assertThat(template.body.lines()[1]).isEqualTo("""<p>Test</p>""")
//
//        println("""Title: "${template.title}" """)
//        println("""Body: "${template.body}" """)
//    }
}
