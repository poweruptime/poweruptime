package org.poweruptime.backend.features.mail.emails

import org.poweruptime.backend.features.mail.Email
import org.thymeleaf.context.Context

data class NewVersionEmail(
    override val to: Set<String>,
    val latestVersion: String,
    override val cc: Set<String>? = null,
    override val bcc: Set<String>? = null,
) : Email {
    override val subject = "poweruptime version $latestVersion available"

    override val context = Context().apply {
        setVariable("latestVersion", latestVersion)
    }

    override val templateName = "new-version"
}
