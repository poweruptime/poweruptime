package org.poweruptime.backend.features.mail.emails

import org.poweruptime.backend.features.authentication.model.UserRecord
import org.poweruptime.backend.features.mail.Email
import org.thymeleaf.context.Context

data class EmailChangeOldEmail(
    val user: UserRecord,
    val cancelToken: String,
    override val cc: Set<String>? = null,
    override val bcc: Set<String>? = null
) : Email {
    override val to = setOf(user.email)

    override val subject = "Email address change requested"

    override val context = Context().apply {
        setVariable("email", user.email)
        setVariable("name", user.name)
        setVariable("cancelToken", cancelToken)
    }

    override val templateName = "email-change-old"
}
