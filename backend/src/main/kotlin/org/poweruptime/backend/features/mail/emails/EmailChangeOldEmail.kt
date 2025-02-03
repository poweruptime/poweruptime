package org.poweruptime.backend.features.mail.emails

import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.mail.Email
import org.thymeleaf.context.Context

data class EmailChangeOldEmail(val user: User, val cancelToken: String) : Email {
    override val to = user.email

    override val subject = "Email address change requested"

    override val context = Context().apply {
        setVariable("email", user.email)
        setVariable("name", user.name)
        setVariable("cancelToken", cancelToken)
    }

    override val templateName = "email-change-old"
}
