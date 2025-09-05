package org.poweruptime.backend.features.mail.emails

import org.poweruptime.backend.features.authentication.model.UserRecord
import org.poweruptime.backend.features.mail.Email
import org.thymeleaf.context.Context

data class EmailChangedEmail(
    val user: UserRecord,
    override val cc: Set<String>? = null,
    override val bcc: Set<String>? = null,
) : Email {
    override val to = setOf(user.email)

    override val subject = "Your email address has been successfully changed"

    override val context = Context().apply {
        setVariable("email", user.email)
        setVariable("name", user.name)
    }

    override val templateName = "email-changed"
}
