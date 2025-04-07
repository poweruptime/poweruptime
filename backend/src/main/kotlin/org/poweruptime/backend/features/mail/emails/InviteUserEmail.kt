package org.poweruptime.backend.features.mail.emails

import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.mail.Email
import org.thymeleaf.context.Context

data class InviteUserEmail(
    val inviter: User?,
    val invitee: User,
    val onetimePassword: String,
    override val cc: Set<String>? = null,
    override val bcc: Set<String>? = null
) : Email {
    override val to = setOf(invitee.email)

    override val subject = "Sign up to poweruptime"

    override val context = Context().apply {
        setVariable("inviterName", inviter?.name ?: "System")
        setVariable("inviterEmail", inviter?.email ?: "-")
        setVariable("inviteeName", invitee.name)
        setVariable("inviteeEmail", invitee.email)
        setVariable("onetimePassword", onetimePassword)
    }

    override val templateName = "invite-user"
}
