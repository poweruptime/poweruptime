package org.poweruptime.backend.features.mail.emails

import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.mail.Email
import org.thymeleaf.context.Context

data class MFALowBackupCodesEmail(
    val user: User,
    val backupCodesCount: Int,
    override val cc: Set<String>? = null,
    override val bcc: Set<String>? = null
) : Email {
    override val to = setOf(user.email)

    override val subject = "Your password has been successfully changed"

    override val context = Context().apply {
        setVariable("email", user.email)
        setVariable("name", user.name)
        setVariable("backupCodesCount", backupCodesCount)
    }

    override val templateName = "mfa-low-backup-codes"
}
