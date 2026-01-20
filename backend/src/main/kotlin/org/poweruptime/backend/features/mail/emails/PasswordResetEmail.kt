package org.poweruptime.backend.features.mail.emails

import org.poweruptime.backend.features.authentication.model.UserRecord
import org.poweruptime.backend.features.mail.Email
import org.thymeleaf.context.Context

data class PasswordResetEmail(
    val user: UserRecord,
    val resetToken: String,
    override val cc: Set<String>? = null,
    override val bcc: Set<String>? = null,
) : Email {
    override val to = setOf(user.email)

    override val subject = "Password reset requested"

    override val context = Context().apply {
        setVariable("email", user.email)
        setVariable("name", user.name)
        setVariable("resetToken", resetToken)
    }

    override val templateName = "reset-password"
}
