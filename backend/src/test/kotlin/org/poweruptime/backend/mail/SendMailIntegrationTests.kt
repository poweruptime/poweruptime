package org.poweruptime.backend.mail

import com.icegreen.greenmail.configuration.GreenMailConfiguration
import com.icegreen.greenmail.junit5.GreenMailExtension
import com.icegreen.greenmail.util.ServerSetupTest
import jakarta.mail.internet.MimeMessage
import org.awaitility.Awaitility.await
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.RegisterExtension
import org.poweruptime.backend.core.BaseTestWithReusingContainers
import org.poweruptime.backend.core.ModelFactory
import org.poweruptime.backend.features.mail.Email
import org.poweruptime.backend.features.mail.emails.InviteUserEmail
import org.poweruptime.backend.features.mail.emails.JoinTeamEmail
import org.poweruptime.backend.features.mail.emails.PasswordResetEmail
import org.poweruptime.backend.features.mail.emails.TestEmail
import org.poweruptime.backend.features.mail.service.EmailTemplateService
import org.poweruptime.backend.features.mail.service.SystemEmailService
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import java.util.concurrent.TimeUnit

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = [
        "poweruptime.mail.enabled=true",
    ],
)
class SendMailIntegrationTests(
    @Autowired val mockMvc: MockMvc,
    @Autowired val systemEmailService: SystemEmailService,
    @Autowired val emailTemplateService: EmailTemplateService,
) : BaseTestWithReusingContainers() {

    @Nested
    @DisplayName("Send mail")
    inner class SendMail {
        @Test
        fun `test success`() = testEmail(TestEmail())

        @Test
        fun `test user invite success`() = testEmail(
            InviteUserEmail(
                inviter = ModelFactory.getTestUser(),
                invitee = ModelFactory.getTestUser(name = "Peter Berger", email = "peter.berger@gmail1234.com"),
                onetimePassword = "token1234",
            ),
        )

        @Test
        fun `test user join team success`() = testEmail(
            JoinTeamEmail(
                inviter = ModelFactory.getTestUser(),
                invitee = ModelFactory.getTestUser(name = "Peter Berger", email = "peter.berger@gmail1234.com"),
                inviterTeam = ModelFactory.getTestTeam(),
                token = "token1234",
            ),
        )

        @Test
        fun `test password reset`() = testEmail(
            PasswordResetEmail(
                user = ModelFactory.getTestUser(
                    email = "test@test.org",
                    name = "Peter Perger",
                ),
                resetToken = "token1234",
            ),
        )

        private fun testEmail(testEmail: Email) {
            systemEmailService.sendEmail(testEmail)

            val (plain, html) = emailTemplateService.getRenderedMail(testEmail)

            mockMvc.get("/v1/public/temp-notification").andExpect {
                status { isOk() }
                content {
                    contentType(MediaType.APPLICATION_JSON)
                    jsonPath("$") { isArray() }
                    jsonPath("$[0].to") { value(testEmail.to.joinToString()) }
                    jsonPath("$[0].subject") { value(testEmail.subject) }
                    jsonPath("$[0].body") { value(plain) }
                    jsonPath("$[0].bodyHTML") { value(html) }
                }
            }

            await().atMost(2, TimeUnit.SECONDS).untilAsserted {
                val receivedMessages: Array<MimeMessage> = greenMail.receivedMessages
                assertEquals(1, receivedMessages.size)

                val receivedMessage: MimeMessage = receivedMessages[0]
                assertEquals(testEmail.subject, receivedMessage.subject)
                assertEquals(1, receivedMessage.allRecipients.size)
                assertEquals(testEmail.to.first(), receivedMessage.allRecipients[0].toString())
            }
        }
    }

    companion object {
        @JvmStatic
        @RegisterExtension
        val greenMail: GreenMailExtension = GreenMailExtension(ServerSetupTest.SMTP)
            .withConfiguration(GreenMailConfiguration.aConfig().withUser("poweruptime", "poweruptime"))
        // .withPerMethodLifecycle(false)
    }
}
