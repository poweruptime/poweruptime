package org.poweruptime.backend.features.mail.emails

import org.poweruptime.backend.features.mail.Email
import org.thymeleaf.context.Context

class TestEmail : Email {
    override val to = "test"

    override val subject = "Test E-Mail"

    override val context = Context()

    override val templateName = "test"
}
