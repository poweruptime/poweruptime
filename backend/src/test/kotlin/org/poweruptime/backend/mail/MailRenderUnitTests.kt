package org.poweruptime.backend.mail

import org.junit.jupiter.api.Test
import org.poweruptime.backend.core.BaseTestWithReusingContainers
import org.poweruptime.backend.core.ModelFactory
import org.poweruptime.backend.core.NonHeadlessSpringBootContextLoader
import org.poweruptime.backend.features.mail.emails.EmailChangeNewEmail
import org.poweruptime.backend.features.mail.emails.EmailChangeOldEmail
import org.poweruptime.backend.features.mail.emails.EmailChangedEmail
import org.poweruptime.backend.features.mail.emails.InviteUserEmail
import org.poweruptime.backend.features.mail.emails.JoinTeamEmail
import org.poweruptime.backend.features.mail.emails.PasswordChangedEmail
import org.poweruptime.backend.features.mail.emails.PasswordResetEmail
import org.poweruptime.backend.features.mail.emails.TestEmail
import org.poweruptime.backend.features.mail.service.EmailTemplateService
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.test.context.ContextConfiguration
import java.awt.Desktop
import java.awt.GraphicsEnvironment
import java.io.File
import java.io.PrintWriter

@ContextConfiguration(loader = NonHeadlessSpringBootContextLoader::class)
class MailRenderUnitTests(
    @Autowired val emailTemplateService: EmailTemplateService,
) : BaseTestWithReusingContainers() {

    val openHTML = !GraphicsEnvironment.isHeadless()

    private fun String.openInBrowser(filename: String? = null): String {
        if (!openHTML) {
            return this
        }

        val file = File("/tmp/email${filename?.let { "_$it" }}.html")
        file.createNewFile()

        PrintWriter(file).use { p ->
            p.println(this)
        }

        Desktop.getDesktop().open(file)

        return this
    }

    @Test
    fun `test mail`() {
        val testMail = emailTemplateService.getRenderedMail(TestEmail())
        println("plain: ${testMail.plain}")
        println("html: ${testMail.html.openInBrowser("test")}")
    }

    @Test
    fun `test email change new`() {
        val testMail = emailTemplateService.getRenderedMail(
            EmailChangeNewEmail(
                user = ModelFactory.getTestUser(name = "Peter Berger", email = "peter.berger@gmail1234.com"),
                newEmail = "test@changed.com",
                confirmToken = "abcdf1234",
            ),
        )
        println("plain: ${testMail.plain}")
        println("html: ${testMail.html.openInBrowser("email_change_new")}")
    }

    @Test
    fun `test email change old`() {
        val testMail = emailTemplateService.getRenderedMail(
            EmailChangeOldEmail(
                user = ModelFactory.getTestUser(name = "Peter Berger", email = "peter.berger@gmail1234.com"),
                cancelToken = "abcdf1234",
            ),
        )
        println("plain: ${testMail.plain}")
        println("html: ${testMail.html.openInBrowser("email_change_old")}")
    }

    @Test
    fun `test email changed`() {
        val testMail = emailTemplateService.getRenderedMail(
            EmailChangedEmail(
                user = ModelFactory.getTestUser(name = "Peter Berger", email = "test@changed.com"),
            ),
        )
        println("plain: ${testMail.plain}")
        println("html: ${testMail.html.openInBrowser("email_changed")}")
    }

    @Test
    fun `test invite user`() {
        val testMail = emailTemplateService.getRenderedMail(
            InviteUserEmail(
                inviter = ModelFactory.getTestUser(name = "Peter Berger", email = "peter.berger@gmail1234.com"),
                invitee = ModelFactory.getTestUser(),
                onetimePassword = "token1234",
            ),
        )
        println("plain: ${testMail.plain}")
        println("html: ${testMail.html.openInBrowser("invite_user")}")
    }

    @Test
    fun `test password changed`() {
        val testMail = emailTemplateService.getRenderedMail(
            PasswordChangedEmail(
                user = ModelFactory.getTestUser(name = "Peter Berger", email = "test@changed.com"),
            ),
        )
        println("plain: ${testMail.plain}")
        println("html: ${testMail.html.openInBrowser("password_changed")}")
    }

    @Test
    fun `test password reset`() {
        val testMail = emailTemplateService.getRenderedMail(
            PasswordResetEmail(
                user = ModelFactory.getTestUser(
                    name = "Peter Berger",
                    email = "peter.berger@gmail1234.com",
                ),
                resetToken = "securetesttoken",
            ),
        )
        println("plain: ${testMail.plain}")
        println("html: ${testMail.html.openInBrowser("reset_password")}")
    }

    @Test
    fun `test join team`() {
        val testMail = emailTemplateService.getRenderedMail(
            JoinTeamEmail(
                inviterTeam = ModelFactory.getTestTeam(),
                inviter = ModelFactory.getTestUser(name = "Peter Berger", email = "peter.berger@gmail1234.com"),
                invitee = ModelFactory.getTestUser(),
                token = "token1234",
            ),
        )
        println("plain: ${testMail.plain}")
        println("html: ${testMail.html.openInBrowser("invite_team")}")
    }
}
