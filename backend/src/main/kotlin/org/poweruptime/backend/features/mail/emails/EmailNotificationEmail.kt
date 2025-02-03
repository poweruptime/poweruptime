package org.poweruptime.backend.features.mail.emails

import org.poweruptime.backend.features.mail.Email
import org.thymeleaf.context.Context

data class EmailNotificationEmail(override val to: String, val title: String, val body: String) : Email {
    override val subject = title

    override val context = Context().apply {
        setVariable("body", body)
    }

    override val templateName = "email-notification"
}
