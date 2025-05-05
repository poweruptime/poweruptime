package org.poweruptime.backend.features.mail.emails

import org.poweruptime.backend.features.mail.Email
import org.thymeleaf.context.Context

data class SetupTestEmail(
    val inviteeEmail: String,
    val code: String,
    override val cc: Set<String>? = null,
    override val bcc: Set<String>? = null
) : Email {
    override val to = setOf(inviteeEmail)

    override val subject = "Sign up to poweruptime"

    override val context = Context().apply {
        setVariable("inviteeEmail", inviteeEmail)
        setVariable("code", code)
    }

    override val templateName = "setup-test"
}
