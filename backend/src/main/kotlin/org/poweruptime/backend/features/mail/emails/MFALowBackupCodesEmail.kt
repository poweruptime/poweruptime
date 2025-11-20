package org.poweruptime.backend.features.mail.emails

import org.poweruptime.backend.features.authentication.model.UserRecord
import org.poweruptime.backend.features.mail.Email
import org.thymeleaf.context.Context

data class MFALowBackupCodesEmail(
    val user: UserRecord,
    val backupCodesCount: Int,
    override val cc: Set<String>? = null,
    override val bcc: Set<String>? = null
) : Email {
    override val to = setOf(user.email)

    override val subject = "Urgent: Backup Codes Running Low"

    override val context = Context().apply {
        setVariable("email", user.email)
        setVariable("name", user.name)
        setVariable("backupCodesCount", backupCodesCount)
    }

    override val templateName = "mfa-low-backup-codes"
}
