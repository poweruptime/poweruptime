package org.poweruptime.backend.features.mail.emails

import org.poweruptime.backend.features.authentication.model.UserRecord
import org.poweruptime.backend.features.mail.Email
import org.thymeleaf.context.Context

data class EmailChangeNewEmail(
    val user: UserRecord,
    val newEmail: String,
    val confirmToken: String,
    override val cc: Set<String>? = null,
    override val bcc: Set<String>? = null,
) : Email {
    override val to = setOf(newEmail)

    override val subject = "Email address change requested"

    override val context = Context().apply {
        setVariable("email", newEmail)
        setVariable("name", user.name)
        setVariable("confirmToken", confirmToken)
    }

    override val templateName = "email-change-new"
}
