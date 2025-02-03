package org.poweruptime.backend.features.mail.emails

import org.poweruptime.backend.features.mail.Email
import org.thymeleaf.context.Context

data class PasswordResetEmail(val email: String, val resetToken: String, val name: String) : Email {
    override val to = email

    override val subject = "Password reset requested"

    override val context = Context().apply {
        setVariable("email", email)
        setVariable("name", name)
        setVariable("resetToken", resetToken)
    }

    override val templateName = "reset-password"
}
